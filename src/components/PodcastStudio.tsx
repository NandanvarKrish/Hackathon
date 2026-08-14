import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Volume2, 
  VolumeX, 
  MessageSquarePlus, 
  Sparkles, 
  Mic, 
  Send, 
  Users, 
  BookOpen, 
  Flame, 
  HelpCircle,
  CheckCircle2,
  CornerDownRight
} from 'lucide-react';
import { PodcastScript, PodcastLine, SmartNote } from '../types/notes';
import { speechService } from '../services/speechService';
import { askPodcastHostQuestion, generatePodcastScript } from '../services/geminiService';
import { useAccessibility } from '../context/AccessibilityContext';

interface PodcastStudioProps {
  notes: SmartNote;
  initialPodcast?: PodcastScript;
  onUpdatePodcast: (newPodcast: PodcastScript) => void;
}

export const PodcastStudio: React.FC<PodcastStudioProps> = ({
  notes,
  initialPodcast,
  onUpdatePodcast
}) => {
  const { announce } = useAccessibility();
  const [podcast, setPodcast] = useState<PodcastScript | undefined>(initialPodcast);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Live Interruption Q&A State
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [interruptionHistory, setInterruptionHistory] = useState<{ question: string; answer: string; speaker: string }[]>([]);

  const lineContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize initial podcast
  useEffect(() => {
    if (initialPodcast) {
      setPodcast(initialPodcast);
    } else if (notes) {
      handleRegenerateScript('dual_host');
    }
  }, [initialPodcast, notes]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
    };
  }, []);

  // Regenerate podcast script
  const handleRegenerateScript = async (format: 'dual_host' | 'storyteller') => {
    setIsGenerating(true);
    speechService.stopSpeaking();
    setIsPlaying(false);
    announce(`Synthesizing ${format === 'dual_host' ? 'Dual-Host Podcast' : 'Storyteller Narrative'} with AI...`);

    try {
      const generated = await generatePodcastScript(notes, format);
      setPodcast(generated);
      onUpdatePodcast(generated);
      setCurrentLineIndex(0);
      setIsGenerating(false);
      announce("Podcast ready to play!");
    } catch (err) {
      console.error("Podcast generation failed:", err);
      setIsGenerating(false);
    }
  };

  // Play line by index
  const playLine = (index: number) => {
    if (!podcast || index >= podcast.dialogue.length) {
      setIsPlaying(false);
      setCurrentLineIndex(0);
      announce("Podcast finished.");
      return;
    }

    const line = podcast.dialogue[index];
    setCurrentLineIndex(index);
    announce(`${line.speaker} says: ${line.text}`);

    speechService.speakText(line.text, {
      speaker: line.speaker,
      rate: playbackSpeed,
      onEnd: () => {
        if (isPlaying) {
          playLine(index + 1);
        }
      },
      onError: () => {
        setIsPlaying(false);
      }
    });

    // Auto-scroll to active line
    const activeEl = document.getElementById(`line-${line.id}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (isPlaying) {
      speechService.stopSpeaking();
      setIsPlaying(false);
      announce("Podcast paused");
    } else {
      setIsPlaying(true);
      announce("Playing podcast");
      playLine(currentLineIndex);
    }
  };

  // Skip Forward 1 Line
  const handleSkipNext = () => {
    if (!podcast) return;
    const next = Math.min(currentLineIndex + 1, podcast.dialogue.length - 1);
    setCurrentLineIndex(next);
    if (isPlaying) {
      playLine(next);
    }
  };

  // Rewind to start
  const handleRewind = () => {
    setCurrentLineIndex(0);
    if (isPlaying) {
      playLine(0);
    }
  };

  // Change speed
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    announce(`Playback speed set to ${speed}x`);
    if (isPlaying) {
      playLine(currentLineIndex);
    }
  };

  // ⚡ Live Interruption: User hits "Interrupt Host & Ask"
  const handleStartInterruption = () => {
    if (isPlaying) {
      speechService.stopSpeaking();
      setIsPlaying(false);
    }
    setIsInterrupting(true);
    announce("Podcast paused. Host is listening for your question.");
  };

  // Submit Question to Host
  const handleSubmitQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuestion.trim() || !podcast) return;

    const currentLine = podcast.dialogue[currentLineIndex] || podcast.dialogue[0];
    setIsAnswering(true);
    announce("Host is thinking and preparing spoken answer...");

    try {
      const result = await askPodcastHostQuestion(
        userQuestion,
        currentLine.text,
        notes,
        currentLine.speaker
      );

      // Record in interruption history
      const newEntry = {
        question: userQuestion,
        answer: result.responseText,
        speaker: result.hostSpeaker
      };
      setInterruptionHistory(prev => [newEntry, ...prev]);

      // Add a dynamic conversational line into the dialogue right after current position
      const newLine: PodcastLine = {
        id: `qa-${Date.now()}`,
        speaker: result.hostSpeaker,
        speakerRole: 'Live Q&A Host',
        text: `[Live Q&A] Listener asked: "${userQuestion}". ${result.responseText}`,
        timestampOffset: 0,
        emotion: 'answering'
      };

      const updatedDialogue = [
        ...podcast.dialogue.slice(0, currentLineIndex + 1),
        newLine,
        ...podcast.dialogue.slice(currentLineIndex + 1)
      ];

      const updatedPodcast: PodcastScript = {
        ...podcast,
        dialogue: updatedDialogue
      };

      setPodcast(updatedPodcast);
      onUpdatePodcast(updatedPodcast);

      // Speak the host's answer out loud immediately!
      speechService.speakText(result.responseText, {
        speaker: result.hostSpeaker,
        rate: playbackSpeed,
        onEnd: () => {
          setIsAnswering(false);
          setIsInterrupting(false);
          setUserQuestion('');
          // Resume podcast playback
          setIsPlaying(true);
          playLine(currentLineIndex + 2);
        }
      });
    } catch (err) {
      console.error("Failed to answer question:", err);
      setIsAnswering(false);
      setIsInterrupting(false);
    }
  };

  const currentDialogue = podcast?.dialogue[currentLineIndex];
  const activeSpeaker = currentDialogue?.speaker || 'Alex';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Podcast Hero Banner & Format Selector */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(225, 29, 72, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(225, 29, 72, 0.4)'
          }}>
            <Radio size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-rose">Interactive Audio Experience</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {podcast?.format === 'dual_host' ? '🎙️ Dual Host (Alex & Jordan)' : '📖 Immersive Storyteller'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {podcast?.title || 'Interactive Lecture Podcast Studio'}
            </h1>
          </div>
        </div>

        {/* Format Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleRegenerateScript('dual_host')}
            disabled={isGenerating}
            className={`btn ${podcast?.format === 'dual_host' ? 'btn-rose' : 'btn-secondary'}`}
          >
            <Users size={16} />
            <span>Dual-Host Debate</span>
          </button>
          <button
            onClick={() => handleRegenerateScript('storyteller')}
            disabled={isGenerating}
            className={`btn ${podcast?.format === 'storyteller' ? 'btn-rose' : 'btn-secondary'}`}
          >
            <BookOpen size={16} />
            <span>Storyteller Narrative</span>
          </button>
        </div>
      </div>

      {/* Main Studio Console: Animated Avatars + Audio Player */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', position: 'relative' }}>
        {/* Animated Avatars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: podcast?.format === 'dual_host' ? 'repeat(2, 1fr)' : '1fr',
          gap: '1.5rem',
          padding: '1rem 0 1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Host 1: Alex (or David for Storyteller) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: activeSpeaker === (podcast?.format === 'dual_host' ? 'Alex' : 'David') ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-tertiary)',
            border: `1px solid ${activeSpeaker === (podcast?.format === 'dual_host' ? 'Alex' : 'David') ? 'var(--accent-cyan-light)' : 'var(--border-subtle)'}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#ffffff',
              position: 'relative'
            }}>
              {podcast?.format === 'dual_host' ? 'A' : 'D'}
              {isPlaying && activeSpeaker === (podcast?.format === 'dual_host' ? 'Alex' : 'David') && (
                <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {podcast?.format === 'dual_host' ? 'Alex (Enthusiast)' : 'David (Storyteller)'}
                </strong>
                {isPlaying && activeSpeaker === (podcast?.format === 'dual_host' ? 'Alex' : 'David') && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Speaking</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {podcast?.format === 'dual_host' ? 'Explores big questions & connects analogies' : 'Immersive narrative audio journey'}
              </p>
            </div>
          </div>

          {/* Host 2: Jordan (only if dual_host) */}
          {podcast?.format === 'dual_host' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: activeSpeaker === 'Jordan' ? 'rgba(167, 139, 250, 0.12)' : 'var(--bg-tertiary)',
              border: `1px solid ${activeSpeaker === 'Jordan' ? 'var(--accent-purple-light)' : 'var(--border-subtle)'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#ffffff',
                position: 'relative'
              }}>
                J
                {isPlaying && activeSpeaker === 'Jordan' && (
                  <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Jordan (Analyst)
                  </strong>
                  {isPlaying && activeSpeaker === 'Jordan' && (
                    <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Speaking</span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Breaks down equations, technical terms & exam takeaways
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audio Playback Controls & Scrubber */}
        <div style={{ padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleRewind}
              className="btn btn-secondary btn-icon"
              title="Restart from beginning"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={togglePlay}
              className="btn btn-rose"
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', borderRadius: 'var(--radius-full)' }}
              aria-label={isPlaying ? "Pause podcast" : "Play podcast"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              <span>{isPlaying ? 'Pause' : 'Play Episode'}</span>
            </button>

            <button
              onClick={handleSkipNext}
              className="btn btn-secondary btn-icon"
              title="Skip to next dialogue line"
            >
              <FastForward size={18} />
            </button>
          </div>

          {/* ⚡ THE INTERRUPT & ASK BUTTON */}
          <button
            onClick={handleStartInterruption}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #059669)',
              padding: '0.75rem 1.4rem',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
            title="Interrupt host to ask a question mid-podcast"
          >
            <Mic size={18} />
            <span>⚡ Interrupt Host & Ask</span>
          </button>

          {/* Speed Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: playbackSpeed === spd ? 'var(--accent-rose)' : 'var(--bg-tertiary)',
                  color: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* ⚡ Live Interruption Dialog Banner */}
        {isInterrupting && (
          <div style={{
            margin: '1rem 0',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(2, 132, 199, 0.12)',
            border: '2px solid var(--accent-cyan-light)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div className="pulse-ring" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan-light)' }} />
              <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan-light)' }}>
                Host is Paused & Ready for Your Question
              </strong>
            </div>

            <form onSubmit={handleSubmitQuestion} style={{ display: 'flex', gap: '0.65rem' }}>
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="E.g., Wait, why does the wave function collapse upon measurement?"
                autoFocus
                disabled={isAnswering}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="submit"
                disabled={isAnswering || !userQuestion.trim()}
                className="btn btn-emerald"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                {isAnswering ? <Sparkles size={16} /> : <Send size={16} />}
                <span>{isAnswering ? 'Host Answering...' : 'Ask Host'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsInterrupting(false); setIsPlaying(true); playLine(currentLineIndex); }}
                className="btn btn-secondary"
              >
                Resume
              </button>
            </form>
          </div>
        )}

        {/* Live Synchronized Transcript / Dialogue Stream */}
        <div 
          ref={lineContainerRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            padding: '1rem',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {podcast?.dialogue.map((line, idx) => {
            const isCurrent = idx === currentLineIndex;
            return (
              <div
                key={line.id || idx}
                id={`line-${line.id}`}
                onClick={() => {
                  setCurrentLineIndex(idx);
                  if (isPlaying) playLine(idx);
                }}
                className={`karaoke-line ${isCurrent ? 'karaoke-active' : ''}`}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  background: isCurrent ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <span style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: line.speaker === 'Alex' ? 'rgba(56, 189, 248, 0.2)' : line.speaker === 'Jordan' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(225, 29, 72, 0.2)',
                  color: line.speaker === 'Alex' ? 'var(--accent-cyan-light)' : line.speaker === 'Jordan' ? 'var(--accent-purple-light)' : 'var(--accent-rose-light)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {line.speaker}
                </span>

                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: isCurrent ? '1rem' : '0.925rem',
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}>
                    {line.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interruption History (Past Questions Answered by Host) */}
      {interruptionHistory.length > 0 && (
        <div className="card" style={{ background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CornerDownRight size={18} color="var(--accent-emerald-light)" />
            <span>Interactive Q&A Session Recap</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {interruptionHistory.map((item, idx) => (
              <div key={idx} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  ❓ <em>"{item.question}"</em>
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--accent-emerald-light)' }}>{item.speaker}:</strong> {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
