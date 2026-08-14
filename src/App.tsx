import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ContextMenuState, 
  LectureMedia, 
  LectureSession, 
  PodcastScript, 
  SmartToolResult, 
  TranscriptSegment,
  ActiveViewType,
  GlobalSearchResult,
  UserAnalytics
} from './types/notes';
import { INITIAL_LECTURE, SIMULATED_LECTURE_STREAM, SAMPLE_MEDIA_NEURAL } from './services/mockData';
import { 
  explainLikeImFive, 
  generateFlashcards, 
  generateMindmap, 
  generateQuiz, 
  generateSmartNotes, 
  generateSmartSummary, 
  getStoredApiKey,
  answerLectureQuestion
} from './services/geminiService';
import { 
  getAllLectures, 
  saveLecture, 
  deleteLecture, 
  getActiveLectureId, 
  setActiveLectureId, 
  getUserAnalytics, 
  setFlashcardMastered, 
  saveQuizAttempt 
} from './services/storageService';
import { speechService, VoiceCommandAction } from './services/speechService';
import { useAccessibility } from './context/AccessibilityContext';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LecturesLibraryView } from './components/LecturesLibraryView';
import { LectureTimelineView } from './components/LectureTimelineView';
import { LectureRecorder } from './components/LectureRecorder';
import { LiveNotePanel } from './components/LiveNotePanel';
import { NotesView } from './components/NotesView';
import { PodcastStudio } from './components/PodcastStudio';
import { SlideGalleryView } from './components/SlideGalleryView';
import { MindmapView } from './components/MindmapView';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ContextMenu } from './components/ContextMenu';
import { SmartToolsModal } from './components/SmartToolsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  const { announce } = useAccessibility();

  // Multi-Lecture Storage & Selection State
  const [lectures, setLectures] = useState<LectureSession[]>(() => getAllLectures());
  const [activeLectureId, setActiveLectureIdState] = useState<string>(() => getActiveLectureId());
  
  const activeLecture = lectures.find(l => l.id === activeLectureId) || lectures[0] || INITIAL_LECTURE;
  const [session, setSession] = useState<LectureSession>(activeLecture);

  // Active View State
  const [activeView, setActiveView] = useState<ActiveViewType>('dashboard');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(() => {
    return localStorage.getItem('echonote_voice_activation') === 'true';
  });
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastHeardPhrase, setLastHeardPhrase] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Modals & Context Menu State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [exportModalLecture, setExportModalLecture] = useState<LectureSession | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getStoredApiKey());

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
  });

  const [smartToolResult, setSmartToolResult] = useState<SmartToolResult | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics>(() => getUserAnalytics());

  const autoNoteTimeoutRef = useRef<any>(null);
  const rawTranscriptRef = useRef<string>('');
  const mediaRef = useRef<LectureMedia[]>([]);
  const recordingSessionRef = useRef<number>(0);
  const previousSectionsRef = useRef<any[]>([]);

  // Synchronize Active Lecture Selection
  const handleSelectLecture = (id: string) => {
    const found = lectures.find(l => l.id === id);
    if (found) {
      setActiveLectureId(id);
      setActiveLectureIdState(id);
      setSession(found);
      setActiveView('notes');
      announce(`Selected lecture: ${found.title}`);
    }
  };

  // Save Session to Local Storage & Refresh Analytics
  useEffect(() => {
    saveLecture(session);
    setLectures(getAllLectures());
    setAnalytics(getUserAnalytics());
  }, [session]);

  // Keep refs in sync so speech callbacks always see fresh values
  useEffect(() => {
    rawTranscriptRef.current = session.rawTranscript;
    mediaRef.current = session.media;
  }, [session.rawTranscript, session.media]);

  // Progressive Live Note Formatter — smart NLP running on every speech chunk
  const updateProgressiveNotes = useCallback((fullTranscript: string, mediaList: LectureMedia[]) => {
    if (!fullTranscript.trim()) return;

    setSession(prev => {
      const rawSentences = fullTranscript
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 6);

      if (rawSentences.length === 0) return prev;

      const existingNotes = prev.notes || {
        title: 'New Lecture Notes',
        executiveSummary: '',
        keyTakeaways: [],
        sections: [],
        keyTerms: [],
        actionItems: []
      };

      let derivedTitle = existingNotes.title;
      const titlePlaceholders = [
        'New Lecture Notes', 'New Lecture Session',
        'New Lecture Notes (Ready to Record)', 'Smart Lecture Study Notes'
      ];
      if (rawSentences.length > 0 && titlePlaceholders.includes(derivedTitle)) {
        const cleaned = rawSentences[0]
          .replace(/^(today we are (talking|learning|discussing) about|welcome to class|hello everyone|let us discuss|we will talk about)\s*/i, '')
          .trim();
        derivedTitle = cleaned.length > 55 ? cleaned.slice(0, 55).trimEnd() + '...' : cleaned;
        derivedTitle = derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1);
      }

      const summary = rawSentences.slice(0, Math.min(3, rawSentences.length)).join(' ');

      const STOPWORDS = new Set([
        'the','a','an','and','or','but','in','on','at','to','for','of','is',
        'it','this','that','with','as','was','are','be','by','from','so','we',
        'our','he','she','they','you','i','me','my','your','will','can','has',
        'have','do','not','no','if','then','there','which','what','when','how',
        'because','also','about','into','just','more','get','let','up','out',
        'some','all','been','its','than','were','would','could','should','very',
        'so','now','here','today','okay','alright','um','uh','like','right'
      ]);

      const scoreSentence = (s: string): number => {
        const words = s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        const meaningful = words.filter(w => w.length > 5 && !STOPWORDS.has(w));
        return meaningful.length / Math.max(1, words.length);
      };

      const scoredSentences = rawSentences
        .map(s => ({ s, score: scoreSentence(s) }))
        .sort((a, b) => b.score - a.score);

      const topBullets = scoredSentences
        .slice(0, 6)
        .map(x => {
          let b = x.s.trim();
          b = b.charAt(0).toUpperCase() + b.slice(1);
          if (!b.endsWith('.') && !b.endsWith('?') && !b.endsWith('!')) b += '.';
          return b;
        });

      const CHUNK = 4;
      const permanentSections: any[] = [];
      const completedSentences = rawSentences.slice(0, -Math.min(4, rawSentences.length));

      for (let i = 0; i < completedSentences.length; i += CHUNK) {
        const chunk = completedSentences.slice(i, i + CHUNK);
        if (chunk.length === 0) continue;

        const firstWords = chunk[0].split(' ').slice(0, 6).join(' ');
        const secTitle = firstWords.charAt(0).toUpperCase() + firstWords.slice(1) + '...';

        const mathMatch = chunk.join(' ').match(/[A-Za-z]\s*=\s*[A-Za-z0-9^+\-*/().\s]{3,40}/);
        const formula = mathMatch ? mathMatch[0].trim() : undefined;

        permanentSections.push({
          id: `sec-${Math.floor(i / CHUNK) + 1}`,
          timestamp: prev.duration,
          title: `${Math.floor(i / CHUNK) + 1}. ${secTitle}`,
          content: chunk.join(' '),
          bulletPoints: chunk.map(s => {
            let b = s.charAt(0).toUpperCase() + s.slice(1);
            if (!b.endsWith('.') && !b.endsWith('?')) b += '.';
            return b;
          }),
          keyFormula: formula
        });
      }

      const liveSentences = rawSentences.slice(-Math.min(4, rawSentences.length));
      const mathLive = liveSentences.join(' ').match(/[A-Za-z]\s*=\s*[A-Za-z0-9^+\-*/().\s]{3,40}/);
      const liveSection = {
        id: 'sec-live',
        timestamp: prev.duration,
        title: `🔴 Live (${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`,
        content: liveSentences.join(' '),
        bulletPoints: liveSentences.map(s => {
          let b = s.charAt(0).toUpperCase() + s.slice(1);
          if (!b.endsWith('.') && !b.endsWith('?')) b += '.';
          return b;
        }),
        keyFormula: mathLive ? mathLive[0].trim() : undefined
      };

      const allSections = [...permanentSections, liveSection];

      const wordFreq: Record<string, number> = {};
      fullTranscript.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
        if (w.length >= 7 && !STOPWORDS.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });
      const topTermWords = Object.entries(wordFreq)
        .filter(([, count]) => count >= 2)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([word]) => word);

      const keyTerms = topTermWords.length > 0
        ? topTermWords.map(w => ({
            term: w.charAt(0).toUpperCase() + w.slice(1),
            definition: `Key concept mentioned ${wordFreq[w]}x — relates to the core topic of ${derivedTitle}.`
          }))
        : existingNotes.keyTerms;

      return {
        ...prev,
        title: derivedTitle,
        notes: {
          ...existingNotes,
          title: derivedTitle,
          executiveSummary: summary,
          keyTakeaways: topBullets.length > 0 ? topBullets : existingNotes.keyTakeaways,
          sections: allSections,
          keyTerms
        }
      };
    });
  }, []);

  const isRecordingRef = useRef(false);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // Speech Recognition Callbacks
  useEffect(() => {
    speechService.setHandlers({
      onStatusChange: (status) => {
        setIsVoiceListening(status);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onHeardPhrase: (phrase) => {
        setLastHeardPhrase(phrase);
      },
      onTranscriptChunk: (chunkText, isFinal) => {
        if (!isRecordingRef.current) return;
        if (!chunkText.trim()) return;

        const newSegment: TranscriptSegment = {
          id: `seg-${Date.now()}`,
          timestamp: Date.now(),
          speaker: 'Speaker',
          text: chunkText.trim()
        };

        setSession(prev => {
          const updatedRaw = (prev.rawTranscript + ' ' + chunkText).trim();
          rawTranscriptRef.current = updatedRaw;

          const updatedTranscript = isFinal
            ? [...prev.transcript, newSegment]
            : prev.transcript;

          if (autoNoteTimeoutRef.current) clearTimeout(autoNoteTimeoutRef.current);
          autoNoteTimeoutRef.current = setTimeout(() => {
            updateProgressiveNotes(rawTranscriptRef.current, mediaRef.current);
          }, 700);

          return {
            ...prev,
            duration: prev.duration + 1,
            rawTranscript: updatedRaw,
            transcript: updatedTranscript
          };
        });
      },
      onCommandDetected: (command: VoiceCommandAction, phrase: string) => {
        handleVoiceCommand(command, phrase);
      }
    });

    if (localStorage.getItem('echonote_voice_activation') === 'true') {
      speechService.setVoiceActivation(true);
    }

    return () => {
      speechService.stopRecordingNotes();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateProgressiveNotes]);

  // Voice Commands Handler
  const handleVoiceCommand = (command: VoiceCommandAction, rawPhrase: string) => {
    announce(`Voice command recognized: "${command}"`);

    if (command === 'START_NOTES') {
      if (!isRecording) handleStartRecording();
    } else if (command === 'STOP_NOTES') {
      if (isRecording) handleStopRecording();
    } else if (command === 'TAKE_PHOTO') {
      setIsCameraModalOpen(true);
      announce("Opening camera to capture slide photo");
    } else if (command === 'CAPTURE_SCREEN') {
      announce("Voice command: Capturing current lecture screen");
    } else if (command === 'PODCAST_MODE') {
      setActiveView('podcast');
      announce("Switching to Podcast Mode");
    } else if (command === 'SUMMARIZE') {
      handleQuickSummary();
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          setIsSearchModalOpen(false);
          setSmartToolResult(null);
          setExportModalLecture(null);
          setIsCameraModalOpen(false);
          setIsApiKeyModalOpen(false);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (isRecording) handleStopRecording();
        else handleStartRecording();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setActiveView('podcast');
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveView('notes');
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setActiveView('mindmap');
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setActiveView('timeline');
      } else if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setSmartToolResult(null);
        setExportModalLecture(null);
        setIsCameraModalOpen(false);
        setIsApiKeyModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  // Toggle Voice Activation
  const handleToggleVoiceActivation = async () => {
    const nextState = !isVoiceListening;
    const success = await speechService.setVoiceActivation(nextState);
    if (success) {
      setIsVoiceListening(nextState);
      localStorage.setItem('echonote_voice_activation', String(nextState));
      announce(nextState ? "Voice wake words activated. Say 'Start notes' whenever ready." : "Voice wake words deactivated.");
    }
  };

  // Recording Controls
  const handleStartRecording = () => {
    recordingSessionRef.current += 1;
    setSession(prev => {
      const existingSections = prev.notes?.sections ?? [];
      previousSectionsRef.current = existingSections.filter(s => s.id !== 'sec-live');
      rawTranscriptRef.current = '';
      return {
        ...prev,
        rawTranscript: '',
        transcript: []
      };
    });

    setIsRecording(true);
    setActiveView('live');
    speechService.startRecordingNotes();
    announce('Live lecture recording started. Notes are writing live on screen!');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    speechService.stopRecordingNotes();
    announce("Recording stopped. Finalizing comprehensive smart lecture notes...");
    handleGenerateNotes();
  };

  // Generate Notes with AI
  const handleGenerateNotes = async () => {
    const currentTranscript = rawTranscriptRef.current ||
      session.transcript.map(t => t.text).join(' ');

    if (!currentTranscript.trim()) return;
    setIsGeneratingNotes(true);
    announce('AI is structuring lecture notes, formulas, and diagrams...');

    const sessionNum = recordingSessionRef.current;
    const sessionLabel = `Recording Session ${sessionNum} — ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    try {
      const generatedNotes = await generateSmartNotes(currentTranscript, session.media);

      setSession(prev => {
        const kept = previousSectionsRef.current;
        const divider = {
          id: `divider-${sessionNum}`,
          timestamp: 0,
          title: `━━━  ${sessionLabel}  ━━━`,
          content: '',
          bulletPoints: [],
        };

        const newSections = (generatedNotes.sections ?? []).map((s: any, i: number) => ({
          ...s,
          id: `s${sessionNum}-${i}`
        }));

        const mergedSections = [
          ...kept,
          ...(kept.length > 0 ? [divider] : []),
          ...newSections
        ];

        const existingTerms = prev.notes?.keyTerms ?? [];
        const newTerms = generatedNotes.keyTerms ?? [];
        const termNames = new Set(existingTerms.map((t: any) => t.term));
        const mergedTerms = [...existingTerms, ...newTerms.filter((t: any) => !termNames.has(t.term))];

        const existingActions = prev.notes?.actionItems ?? [];
        const newActions = (generatedNotes.actionItems ?? []).map((a: any, i: number) => ({
          ...a,
          id: `s${sessionNum}-act-${i}`
        }));

        return {
          ...prev,
          title: generatedNotes.title || prev.title,
          notes: {
            ...(prev.notes ?? {}),
            title: generatedNotes.title || prev.notes?.title || prev.title,
            executiveSummary: generatedNotes.executiveSummary || prev.notes?.executiveSummary || '',
            keyTakeaways: [
              ...(prev.notes?.keyTakeaways ?? []),
              ...(generatedNotes.keyTakeaways ?? [])
            ].slice(0, 8),
            sections: mergedSections,
            keyTerms: mergedTerms,
            actionItems: [...existingActions, ...newActions]
          }
        };
      });

      previousSectionsRef.current = [];
      setIsGeneratingNotes(false);
      setActiveView('notes');
      announce('Smart notes synthesized successfully!');
    } catch (err) {
      console.error('Failed to generate notes:', err);
      setIsGeneratingNotes(false);
    }
  };

  // Create New Lecture
  const handleNewLecture = () => {
    const newSession: LectureSession = {
      id: `session-${Date.now()}`,
      title: 'New Lecture Session',
      subject: 'Live Lecture Note',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: 0,
      rawTranscript: '',
      transcript: [],
      media: [],
      notes: {
        title: 'New Lecture Notes (Ready to Record)',
        executiveSummary: 'Say "Start notes" or click Start Notes to begin. Notes will stream and write live inside this document as you speak.',
        keyTakeaways: [
          'Live speech is automatically transcribed into structured notes.',
          'On-screen diagrams and slides are automatically captured and analyzed.'
        ],
        sections: [],
        keyTerms: [],
        actionItems: []
      }
    };
    saveLecture(newSession);
    setSession(newSession);
    setActiveView('live');
    announce("Created new empty lecture session. Ready to record!");
  };

  // ⚡ Dedicated Judge Demo Mode Launcher (3-Minute Automated Flow)
  const handleStartDemoMode = () => {
    setIsDemoMode(true);
    const demoSession: LectureSession = {
      id: `demo-quantum-${Date.now()}`,
      title: 'Demo: Deep Learning & Scaled Attention Mechanisms',
      subject: 'Computer Science & AI',
      date: 'August 14, 2026',
      duration: 180,
      isDemo: true,
      rawTranscript: `Welcome class! Today we are discussing deep neural networks and attention mechanisms. In sequence modeling, traditional Recurrent Neural Networks suffered from vanishing gradients over long context windows. In 2017, the breakthrough paper 'Attention Is All You Need' introduced the Transformer architecture. The fundamental operation is Scaled Dot-Product Attention: Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V. Let me capture this slide on the whiteboard so you can inspect the multi-head projections. Notice that dividing by the square root of key dimension d_k scales dot products to prevent softmax saturation.`,
      transcript: [
        { id: 'dt-1', timestamp: 0, speaker: 'Prof. Carter (Demo)', text: 'Welcome class! Today we are discussing deep neural networks and attention mechanisms.' },
        { id: 'dt-2', timestamp: 15, speaker: 'Prof. Carter (Demo)', text: 'In sequence modeling, traditional Recurrent Neural Networks suffered from vanishing gradients over long context windows.' },
        { id: 'dt-3', timestamp: 35, speaker: 'Prof. Carter (Demo)', text: "In 2017, the breakthrough paper 'Attention Is All You Need' introduced the Transformer architecture." },
        { id: 'dt-4', timestamp: 65, speaker: 'Prof. Carter (Demo)', text: 'The fundamental operation is Scaled Dot-Product Attention: Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V.' }
      ],
      media: [SAMPLE_MEDIA_NEURAL],
      notes: {
        title: 'Transformer Architecture & Scaled Dot-Product Attention',
        executiveSummary: 'This lecture examines why Scaled Dot-Product Attention replaced Recurrent Neural Networks, providing multi-head query-key-value transformations across context windows.',
        keyTakeaways: [
          'Attention(Q, K, V) = softmax((Q * K^T) / √d_k) * V eliminates sequential bottleneck.',
          'Dividing by √d_k prevents vanishing gradients during softmax calculation.',
          'Multi-Head attention allows joint representation across different representation subspaces.'
        ],
        sections: [
          {
            id: 'sec-d1',
            timestamp: 0,
            title: '1. Limitations of RNNs & The Attention Breakthrough',
            content: 'Traditional sequential architectures process tokens step-by-step, making parallel training impossible over long sequence lengths.',
            bulletPoints: [
              'Recurrent bottleneck eliminated by self-attention.',
              'O(1) sequential operations per layer.'
            ],
            keyFormula: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
            mediaId: SAMPLE_MEDIA_NEURAL.id
          }
        ],
        keyTerms: [
          { term: 'Attention Mechanism', definition: 'A mechanism allowing models to dynamically weigh the importance of different tokens in a sequence.' },
          { term: 'Softmax Saturation', definition: 'Extremely large dot products push softmax into regions with vanishingly small gradients.' }
        ],
        actionItems: [
          { id: 'dact-1', text: 'Implement MultiHeadAttention in PyTorch', completed: true },
          { id: 'dact-2', text: 'Calculate Q, K, V tensor dimensions for sequence length N', completed: false }
        ],
        flashcards: [
          { id: 'dfc-1', front: 'What is the mathematical formula for Scaled Dot-Product Attention?', back: 'Attention(Q, K, V) = softmax((Q K^T) / √d_k) V', category: 'Deep Learning' },
          { id: 'dfc-2', front: 'Why do we divide by √d_k in scaled attention?', back: 'To scale large dot products so softmax gradients do not vanish.', category: 'Math Details' }
        ],
        quiz: [
          {
            id: 'dq-1',
            question: 'What operation is used to prevent softmax saturation in scaled attention?',
            options: ['Multiplying by sequence length', 'Dividing by √d_k', 'Applying L2 regularization', 'Adding bias vectors'],
            correctIndex: 1,
            explanation: 'Dividing by the square root of key dimension d_k prevents dot products from growing excessively large.'
          }
        ]
      }
    };

    saveLecture(demoSession);
    setSession(demoSession);
    setActiveView('timeline');
    announce("Launched Judge Demo Mode. Viewing unified lecture timeline!");
  };

  // Context Menu Trigger
  const handleContextMenuTrigger = (e: React.MouseEvent, sectionText: string, sectionId?: string) => {
    e.preventDefault();
    const selected = window.getSelection()?.toString().trim() || sectionText;
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      selectedText: selected,
      sourceSectionId: sectionId
    });
  };

  // Context Menu Actions
  const handleContextMenuAction = async (action: 'summary' | 'eli5' | 'flashcards' | 'quiz' | 'mindmap' | 'speak' | 'askAi') => {
    const text = contextMenu.selectedText || session.notes?.executiveSummary || session.rawTranscript;

    if (action === 'speak') {
      speechService.speakText(text, { speaker: 'Alex' });
      announce("Reading selection aloud");
      return;
    }

    if (action === 'summary') {
      announce("Generating 3-bullet instant summary...");
      const points = await generateSmartSummary(text);
      setSmartToolResult({
        type: 'summary',
        title: '⚡ Instant 3-Bullet Summary',
        summaryPoints: points
      });
    } else if (action === 'eli5') {
      announce("Generating ELI5 simplified explanation...");
      const eli5 = await explainLikeImFive(text);
      setSmartToolResult({
        type: 'eli5',
        title: '👶 Explain Like I\'m 5 (ELI5)',
        eli5Text: eli5
      });
    } else if (action === 'flashcards') {
      announce("Generating interactive study flashcards...");
      const cards = await generateFlashcards(text);
      setSmartToolResult({
        type: 'flashcards',
        title: '🗂️ Interactive Study Flashcards',
        flashcards: cards
      });
    } else if (action === 'quiz') {
      announce("Generating 3-question practice quiz...");
      const quizItems = await generateQuiz(text);
      setSmartToolResult({
        type: 'quiz',
        title: '❓ Concept Mastery Quiz',
        quiz: quizItems
      });
    } else if (action === 'mindmap') {
      announce("Generating visual concept mindmap...");
      const tree = await generateMindmap(text);
      setSmartToolResult({
        type: 'mindmap',
        title: '🗺️ Concept Mindmap Graph',
        mindmap: tree
      });
    } else if (action === 'askAi') {
      setSmartToolResult({
        type: 'askAi',
        title: '💬 Ask AI About This Concept',
        content: text
      });
    }
  };

  const handleQuickSummary = async () => {
    const text = session.notes?.executiveSummary || session.rawTranscript;
    const points = await generateSmartSummary(text);
    setSmartToolResult({
      type: 'summary',
      title: '⚡ Smart Lecture Summary',
      summaryPoints: points
    });
  };

  // Toggle Action Item Checkbox
  const handleToggleActionItem = (id: string) => {
    if (!session.notes) return;
    const updated = session.notes.actionItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setSession(prev => ({
      ...prev,
      notes: prev.notes ? { ...prev.notes, actionItems: updated } : undefined
    }));
  };

  // Add Captured Media (From Screen Observer or Camera)
  const handleMediaCaptured = (mediaItem: LectureMedia) => {
    setSession(prev => {
      const updatedMedia = [mediaItem, ...prev.media];

      const newDiagramSection = {
        id: `sec-media-${mediaItem.id}`,
        timestamp: mediaItem.timestamp,
        title: `📊 ${mediaItem.title}`,
        content: mediaItem.aiExplanation,
        bulletPoints: [
          `Visual Concept: ${mediaItem.title}`,
          `OCR Extracted: ${mediaItem.ocrText.slice(0, 100)}...`
        ],
        keyFormula: mediaItem.ocrText.includes('=') ? mediaItem.ocrText : undefined,
        mediaId: mediaItem.id
      };

      const existingNotes = prev.notes || {
        title: prev.title,
        executiveSummary: 'Lecture with visual diagram capture.',
        keyTakeaways: [`Captured diagram: ${mediaItem.title}`],
        sections: [],
        keyTerms: [],
        actionItems: []
      };

      return {
        ...prev,
        media: updatedMedia,
        notes: {
          ...existingNotes,
          sections: [newDiagramSection, ...existingNotes.sections]
        }
      };
    });
    announce(`Diagram "${mediaItem.title}" automatically embedded into your notes!`);
  };

  // Update Podcast
  const handleUpdatePodcast = (newPodcast: PodcastScript) => {
    setSession(prev => ({
      ...prev,
      podcast: newPodcast
    }));
  };

  // Handle Search Result Click
  const handleSelectSearchResult = (result: GlobalSearchResult) => {
    handleSelectLecture(result.lectureId);
    if (result.type === 'slide') setActiveView('media');
    else if (result.type === 'transcript') setActiveView('timeline');
    else setActiveView('notes');
  };

  // Handle Delete Lecture
  const handleDeleteLecture = (id: string) => {
    deleteLecture(id);
    const updatedLectures = getAllLectures();
    setLectures(updatedLectures);
    if (activeLectureId === id && updatedLectures.length > 0) {
      setSession(updatedLectures[0]);
      setActiveLectureIdState(updatedLectures[0].id);
    }
    announce('Deleted lecture from library.');
  };

  return (
    <div 
      className="app-container" 
      onContextMenu={(e) => {
        if (!contextMenu.visible && window.getSelection()?.toString().trim()) {
          handleContextMenuTrigger(e, window.getSelection()!.toString().trim());
        }
      }}
    >
      {/* Top Sticky Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        isVoiceListening={isVoiceListening}
        isRecording={isRecording}
        onNewLecture={handleNewLecture}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onStartDemoMode={handleStartDemoMode}
        hasApiKey={hasApiKey}
        lectureTitle={session.notes?.title || session.title}
        onToggleVoiceActivation={handleToggleVoiceActivation}
        lastHeardPhrase={lastHeardPhrase}
        isDemoMode={isDemoMode}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* VIEW 1: Dashboard View */}
        {activeView === 'dashboard' && (
          <DashboardView
            analytics={analytics}
            recentLectures={lectures.slice(0, 6)}
            onStartNewLecture={handleNewLecture}
            onSelectLecture={handleSelectLecture}
            onDeleteLecture={handleDeleteLecture}
            onStartDemoMode={handleStartDemoMode}
            onOpenExportModal={(lec) => setExportModalLecture(lec)}
            onNavigateView={(vw) => setActiveView(vw)}
          />
        )}

        {/* VIEW 2: Live Recording & Real-Time Note Writer */}
        {activeView === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            <LectureRecorder
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              transcript={session.transcript}
              rawTranscript={session.rawTranscript}
              onTranscriptUpdate={(newSeg) => {
                setSession(prev => {
                  const updatedRaw = `${prev.rawTranscript} ${newSeg.text}`.trim();
                  return {
                    ...prev,
                    duration: prev.duration + 4,
                    rawTranscript: updatedRaw,
                    transcript: [...prev.transcript, newSeg]
                  };
                });
                updateProgressiveNotes(`${session.rawTranscript} ${newSeg.text}`.trim(), session.media);
              }}
              onOpenCaptureModal={() => setIsCameraModalOpen(true)}
              onGenerateNotes={handleGenerateNotes}
              isGenerating={isGeneratingNotes}
              audioLevel={audioLevel}
              onVoiceTriggerTest={(cmd) => handleVoiceCommand(cmd as any, 'manual trigger')}
              onToggleVoiceActivation={handleToggleVoiceActivation}
              isVoiceListening={isVoiceListening}
            />

            <LiveNotePanel
              notes={session.notes}
              isRecording={isRecording}
              isGenerating={isGeneratingNotes}
              rawTranscript={session.rawTranscript}
            />
          </div>
        )}

        {/* VIEW 3: Lectures Library */}
        {activeView === 'library' && (
          <LecturesLibraryView
            lectures={lectures}
            onSelectLecture={handleSelectLecture}
            onDeleteLecture={handleDeleteLecture}
            onNewLecture={handleNewLecture}
            onOpenExportModal={(lec) => setExportModalLecture(lec)}
          />
        )}

        {/* VIEW 4: Chronological Lecture Timeline */}
        {activeView === 'timeline' && (
          <LectureTimelineView
            session={session}
            onSelectTimestamp={(secs) => announce(`Jumped to timeline timestamp ${secs}s`)}
          />
        )}

        {/* VIEW 5: Smart Notes View */}
        {activeView === 'notes' && session.notes && (
          <NotesView
            notes={session.notes}
            media={session.media}
            onOpenPodcast={() => setActiveView('podcast')}
            onOpenMindmap={() => setActiveView('mindmap')}
            onToggleActionItem={handleToggleActionItem}
            onContextMenuTrigger={handleContextMenuTrigger}
            isRecording={isRecording}
          />
        )}

        {/* VIEW 6: Podcast Studio */}
        {activeView === 'podcast' && session.notes && (
          <PodcastStudio
            notes={session.notes}
            initialPodcast={session.podcast}
            onUpdatePodcast={handleUpdatePodcast}
          />
        )}

        {/* VIEW 7: Slide & Whiteboard Vision Gallery */}
        {activeView === 'media' && (
          <SlideGalleryView
            media={session.media}
            onOpenCaptureModal={() => setIsCameraModalOpen(true)}
          />
        )}

        {/* VIEW 8: Concept Mindmap */}
        {activeView === 'mindmap' && (
          <MindmapView
            mindmap={session.notes?.mindmap}
            lectureTitle={session.notes?.title || session.title}
          />
        )}
      </main>

      {/* Slide / Whiteboard Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onMediaCaptured={handleMediaCaptured}
        currentTimestamp={session.duration}
      />

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={() => setHasApiKey(!!getStoredApiKey())}
      />

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={!!exportModalLecture}
        onClose={() => setExportModalLecture(null)}
        lecture={exportModalLecture}
      />

      {/* Right-Click Accessible Context Menu */}
      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onSelectAction={handleContextMenuAction}
      />

      {/* Smart Tools Interactive Results Modal */}
      <SmartToolsModal
        isOpen={!!smartToolResult}
        onClose={() => setSmartToolResult(null)}
        result={smartToolResult}
        onAskAiSubmit={async (q) => {
          const res = await answerLectureQuestion(q, {
            title: session.title,
            transcript: session.rawTranscript,
            summary: session.notes?.executiveSummary || '',
            notesSnippet: session.notes?.sections?.map(s => s.content).join(' ') || ''
          });
          return res;
        }}
      />
    </div>
  );
};
