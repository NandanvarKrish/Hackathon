import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ContextMenuState, 
  LectureMedia, 
  LectureSession, 
  PodcastScript, 
  SmartToolResult, 
  TranscriptSegment 
} from './types/notes';
import { INITIAL_LECTURE } from './services/mockData';
import { 
  explainLikeImFive, 
  generateFlashcards, 
  generateMindmap, 
  generateQuiz, 
  generateSmartNotes, 
  generateSmartSummary, 
  getStoredApiKey 
} from './services/geminiService';
import { speechService, VoiceCommandAction } from './services/speechService';
import { useAccessibility } from './context/AccessibilityContext';

import { Header } from './components/Header';
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

export const App: React.FC = () => {
  const { announce } = useAccessibility();

  // Session State
  const [session, setSession] = useState<LectureSession>(() => {
    const saved = localStorage.getItem('echonote_active_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_LECTURE;
      }
    }
    return INITIAL_LECTURE;
  });

  const [activeTab, setActiveTab] = useState<'notes' | 'podcast' | 'media' | 'mindmap'>('notes');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(() => {
    return localStorage.getItem('echonote_voice_activation') === 'true';
  });
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastHeardPhrase, setLastHeardPhrase] = useState<string>('');

  // Modals & Context Menu State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => !!getStoredApiKey());

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
  });

  const [smartToolResult, setSmartToolResult] = useState<SmartToolResult | null>(null);

  const autoNoteTimeoutRef = useRef<any>(null);
  const rawTranscriptRef = useRef<string>('');
  const mediaRef = useRef<LectureMedia[]>([]);
  // Counts how many recording sessions have started — used to label sections
  const recordingSessionRef = useRef<number>(0);
  // Snapshot of sections from before the current recording — preserved across sessions
  const previousSectionsRef = useRef<any[]>([]);

  // Save Session to LocalStorage
  useEffect(() => {
    localStorage.setItem('echonote_active_session', JSON.stringify(session));
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
      // ── 1. TOKENISE into clean sentences ─────────────────────────────────
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

      // ── 2. DERIVE TITLE from first topic sentence ─────────────────────────
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

      // ── 3. EXECUTIVE SUMMARY — first 2-3 sentences ───────────────────────
      const summary = rawSentences.slice(0, Math.min(3, rawSentences.length)).join(' ');

      // ── 4. SMART BULLET POINTS — pick distinct non-trivial sentences ──────
      const STOPWORDS = new Set([
        'the','a','an','and','or','but','in','on','at','to','for','of','is',
        'it','this','that','with','as','was','are','be','by','from','so','we',
        'our','he','she','they','you','i','me','my','your','will','can','has',
        'have','do','not','no','if','then','there','which','what','when','how',
        'because','also','about','into','just','more','get','let','up','out',
        'some','all','been','its','than','were','would','could','should','very',
        'so','now','here','today','okay','alright','um','uh','like','right'
      ]);

      // Score each sentence by information density (unique long words / length)
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

      // ── 5. GROUP INTO SECTIONS — chunk every ~4 sentences ────────────────
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

      // ── 6. LIVE SECTION — last few unfinished sentences ───────────────────
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

      // ── 7. EXTRACT KEY TERMS — repeated long words as glossary ────────────
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

  // isRecordingRef so the speech callback always sees current value without stale closure
  const isRecordingRef = useRef(false);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // Initialize Speech Recognition Handlers — run only once on mount
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
        // Always read from ref — avoids stale closure over isRecording
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

          // Debounced note update — fire 700ms after last chunk
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

  // Voice Command Dispatcher
  const handleVoiceCommand = (command: VoiceCommandAction, rawPhrase: string) => {
    announce(`Voice command recognized: "${command}"`);
    console.log("Voice Command Triggered:", command, rawPhrase);

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
      setActiveTab('podcast');
      announce("Switching to Podcast Mode");
    } else if (command === 'SUMMARIZE') {
      handleQuickSummary();
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (isRecording) handleStopRecording();
        else handleStartRecording();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setActiveTab('podcast');
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsCameraModalOpen(true);
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveTab('notes');
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setActiveTab('mindmap');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  // Toggle Voice Activation Switch
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
    // Bump session counter
    recordingSessionRef.current += 1;

    // Snapshot existing sections so new session appends after them
    setSession(prev => {
      const existingSections = prev.notes?.sections ?? [];
      // Filter out any leftover live section from a previous session
      previousSectionsRef.current = existingSections.filter(s => s.id !== 'sec-live');
      // Reset only the current transcript — keep notes history
      rawTranscriptRef.current = '';
      return {
        ...prev,
        rawTranscript: '',
        transcript: []
      };
    });

    setIsRecording(true);
    setActiveTab('notes');
    speechService.startRecordingNotes();
    announce('Live lecture recording started. Notes are writing live on screen!');

    setTimeout(() => {
      document.getElementById('notes-view-root')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    speechService.stopRecordingNotes();
    announce("Recording stopped. Finalizing comprehensive smart lecture notes...");
    handleGenerateNotes();
  };

  // Generate Notes — appends new session sections instead of replacing everything
  const handleGenerateNotes = async () => {
    // Capture transcript at this moment
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

        // Add a session divider section at the top of the new batch
        const divider = {
          id: `divider-${sessionNum}`,
          timestamp: 0,
          title: `━━━  ${sessionLabel}  ━━━`,
          content: '',
          bulletPoints: [],
        };

        // Re-stamp all new section IDs with session number so they never clash
        const newSections = (generatedNotes.sections ?? []).map((s: any, i: number) => ({
          ...s,
          id: `s${sessionNum}-${i}`
        }));

        const mergedSections = [
          ...kept,
          ...(kept.length > 0 ? [divider] : []),
          ...newSections
        ];

        // Merge key terms & action items (deduplicate by term/id)
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

      // Snapshot the now-merged sections for the next session
      previousSectionsRef.current = [];
      setIsGeneratingNotes(false);
      setActiveTab('notes');
      announce('Smart notes synthesised successfully!');
    } catch (err) {
      console.error('Failed to generate notes:', err);
      setIsGeneratingNotes(false);
    }
  };

  // Handle New Lecture Session
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
    setSession(newSession);
    setActiveTab('notes');
    announce("Created new empty lecture session. Ready to record!");
  };

  // Right-Click Context Menu Trigger
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

  // Handle Action Selected from Context Menu
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

  // Add Captured Media (From Screen Observer or Camera) AND automatically insert into Notes!
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

  return (
    <div className="app-container" onContextMenu={(e) => {
      if (!contextMenu.visible && window.getSelection()?.toString().trim()) {
        handleContextMenuTrigger(e, window.getSelection()!.toString().trim());
      }
    }}>
      {/* Top Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isVoiceListening={isVoiceListening}
        isRecording={isRecording}
        onNewLecture={handleNewLecture}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={hasApiKey}
        lectureTitle={session.notes?.title || session.title}
        onToggleVoiceActivation={handleToggleVoiceActivation}
        lastHeardPhrase={lastHeardPhrase}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Lecture Recorder & Auto Screen Observer Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
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

          {/* Live Note Panel — shows notes being built in real-time */}
          <LiveNotePanel
            notes={session.notes}
            isRecording={isRecording}
            isGenerating={isGeneratingNotes}
            rawTranscript={session.rawTranscript}
          />
        </div>

        {/* Tab 1: Smart Notes View (Displays Notes writing live directly on screen) */}
        {activeTab === 'notes' && session.notes && (
          <NotesView
            notes={session.notes}
            media={session.media}
            onOpenPodcast={() => setActiveTab('podcast')}
            onOpenMindmap={() => setActiveTab('mindmap')}
            onToggleActionItem={handleToggleActionItem}
            onContextMenuTrigger={handleContextMenuTrigger}
            onUpdateNotes={(updated) => setSession(prev => ({ ...prev, notes: updated }))}
            isRecording={isRecording}
          />
        )}

        {/* Tab 2: Interactive Podcast Studio */}
        {activeTab === 'podcast' && session.notes && (
          <PodcastStudio
            notes={session.notes}
            initialPodcast={session.podcast}
            onUpdatePodcast={handleUpdatePodcast}
          />
        )}

        {/* Tab 3: Slide & Whiteboard Vision Gallery */}
        {activeTab === 'media' && (
          <SlideGalleryView
            media={session.media}
            onOpenCaptureModal={() => setIsCameraModalOpen(true)}
          />
        )}

        {/* Tab 4: Concept Mindmap */}
        {activeTab === 'mindmap' && (
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
          const res = await explainLikeImFive(q);
          return res;
        }}
      />
    </div>
  );
};
