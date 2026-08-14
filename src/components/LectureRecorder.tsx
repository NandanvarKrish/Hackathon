import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Camera, 
  Sparkles, 
  FileAudio, 
  Clock, 
  Activity, 
  HelpCircle,
  Volume2,
  Power
} from 'lucide-react';
import { TranscriptSegment } from '../types/notes';
import { SIMULATED_LECTURE_STREAM } from '../services/mockData';
import { useAccessibility } from '../context/AccessibilityContext';

interface LectureRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  transcript: TranscriptSegment[];
  rawTranscript: string;
  onTranscriptUpdate: (newSegment: TranscriptSegment) => void;
  onOpenCaptureModal: () => void;
  onGenerateNotes: () => void;
  isGenerating: boolean;
  audioLevel?: number;
  onVoiceTriggerTest?: (command: string) => void;
  onToggleVoiceActivation?: () => void;
  isVoiceListening?: boolean;
}

export const LectureRecorder: React.FC<LectureRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  transcript,
  rawTranscript,
  onTranscriptUpdate,
  onOpenCaptureModal,
  onGenerateNotes,
  isGenerating,
  audioLevel = 0,
  onVoiceTriggerTest,
  onToggleVoiceActivation,
  isVoiceListening
}) => {
  const { announce } = useAccessibility();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [manualInputText, setManualInputText] = useState('');
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Audio Waveform Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      if (isRecording || isVoiceListening) {
        ctx.lineWidth = 2.5;
        const numWaves = 3;
        const colors = isRecording 
          ? ['rgba(225, 29, 72, 0.9)', 'rgba(251, 113, 133, 0.8)', 'rgba(167, 139, 250, 0.7)']
          : ['rgba(56, 189, 248, 0.9)', 'rgba(16, 185, 129, 0.8)', 'rgba(167, 139, 250, 0.7)'];

        const dynamicAmp = (isRecording ? 14 : 4) + (audioLevel > 5 ? (audioLevel / 2) : Math.sin(phase * 2) * 5);

        for (let w = 0; w < numWaves; w++) {
          ctx.beginPath();
          ctx.strokeStyle = colors[w];
          for (let x = 0; x < width; x++) {
            const freq = 0.02 + w * 0.012;
            const y = centerY + Math.sin(x * freq + phase + w * 1.5) * dynamicAmp * Math.sin((x / width) * Math.PI);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        phase += 0.08;
      } else {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, isVoiceListening, audioLevel]);

  // Handle manual speech entry if mic is quiet
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputText.trim()) return;
    onTranscriptUpdate({
      id: `man-${Date.now()}`,
      timestamp: elapsedSeconds || 5,
      speaker: 'Lecturer',
      text: manualInputText.trim()
    });
    setManualInputText('');
  };

  // Interactive Live Demo Simulation
  const handleStartSimulation = () => {
    if (isRecording) {
      onStopRecording();
    }
    setIsSimulating(true);
    onStartRecording();
    announce("Simulating live lecture stream on Deep Learning & Transformers...");

    let index = 0;
    const interval = setInterval(() => {
      if (index < SIMULATED_LECTURE_STREAM.length) {
        const text = SIMULATED_LECTURE_STREAM[index];
        onTranscriptUpdate({
          id: `sim-${Date.now()}-${index}`,
          timestamp: index * 12,
          speaker: 'Prof. Carter (AI)',
          text
        });
        index++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        announce("Lecture stream complete. Generating smart notes...");
        onStopRecording();
        onGenerateNotes();
      }
    }, 2200);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Recording Control Center Card */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className={`badge ${isRecording ? 'badge-rose' : isVoiceListening ? 'badge-emerald' : 'badge-cyan'}`}>
                {isRecording ? '🔴 RECORDING NOTES LIVE' : isVoiceListening ? '🎙️ VOICE WAKE WORDS ACTIVE' : 'AUDIO RECORDER'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isVoiceListening ? 'Say "Start notes" / "Stop notes" / "Take photo"' : 'Voice wake words disabled'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.35rem' }}>
              Smart Voice Automated Note Taker
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Stable Voice Activation Toggle Button */}
            {onToggleVoiceActivation && (
              <button
                onClick={onToggleVoiceActivation}
                className={`btn ${isVoiceListening ? 'btn-emerald' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
                title="Toggle continuous voice wake word listening"
              >
                <Power size={14} />
                <span>{isVoiceListening ? 'Voice Commands: ON' : 'Voice Commands: OFF'}</span>
              </button>
            )}

            {/* Mic Volume Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Volume2 size={15} color="var(--accent-emerald-light)" />
              <div style={{ width: '40px', height: '6px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (audioLevel || (isRecording ? 40 : 15)) * 2)}%`, height: '100%', background: 'var(--accent-emerald-light)', transition: 'width 0.1s' }} />
              </div>
            </div>

            {/* Timer Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '1rem',
              color: isRecording ? 'var(--accent-rose-light)' : 'var(--text-primary)'
            }}>
              <Clock size={16} />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Voice Command Quick Help Toggle */}
            <button
              onClick={() => setShowCommandsHelp(prev => !prev)}
              className="btn btn-secondary btn-icon"
              title="View voice trigger commands"
              aria-label="Toggle voice trigger commands guide"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        {/* Voice Trigger Banner / Guide */}
        {showCommandsHelp && (
          <div style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.825rem'
          }}>
            <div>
              <strong style={{ color: 'var(--accent-cyan-light)' }}>🎙️ "Start notes"</strong>
              <p style={{ color: 'var(--text-muted)' }}>Begins live audio capture & structured note taking.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--accent-rose-light)' }}>⏹️ "Stop notes"</strong>
              <p style={{ color: 'var(--text-muted)' }}>Stops and triggers automatic AI note structuring.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--accent-emerald-light)' }}>📸 "Take photo"</strong>
              <p style={{ color: 'var(--text-muted)' }}>Opens camera to snap whiteboard/slide with OCR.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--accent-amber-light)' }}>🖥️ "Capture diagram"</strong>
              <p style={{ color: 'var(--text-muted)' }}>Captures on-screen slide/diagram from shared window.</p>
            </div>
          </div>
        )}

        {/* Dynamic Waveform Visualizer */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '75px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={75}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {!isRecording && (
            <span style={{
              position: 'absolute',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              {isVoiceListening ? '🎙️ Voice wake words active — say "Start notes" to begin' : 'Voice engine ready — click Start Notes or enable voice commands above'}
            </span>
          )}
        </div>

        {/* Action Buttons & Voice Trigger Simulator Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {!isRecording ? (
              <button
                onClick={onStartRecording}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.4rem' }}
                aria-label="Start recording notes"
              >
                <Mic size={18} />
                <span>Start Notes</span>
              </button>
            ) : (
              <button
                onClick={onStopRecording}
                className="btn btn-rose"
                style={{ padding: '0.75rem 1.4rem' }}
                aria-label="Stop recording notes"
              >
                <Square size={18} />
                <span>Stop Notes & Finalize</span>
              </button>
            )}

            {/* Live Camera / Slide Capture */}
            <button
              onClick={onOpenCaptureModal}
              className="btn btn-emerald"
              title="Snap a slide or whiteboard diagram"
            >
              <Camera size={18} />
              <span>Capture Slide (Camera)</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Quick Simulated Stream for Demos */}
            <button
              onClick={handleStartSimulation}
              disabled={isSimulating}
              className="btn btn-secondary"
              title="Run a quick automated test stream"
            >
              <Activity size={16} color="var(--accent-amber-light)" />
              <span>{isSimulating ? 'Streaming Demo Lecture...' : 'Simulate Lecture Stream'}</span>
            </button>

            {/* Synthesize Smart Notes button */}
            <button
              onClick={onGenerateNotes}
              disabled={isGenerating || (!rawTranscript && transcript.length === 0)}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0284c7)' }}
              title="Generate structured smart notes with AI"
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Notes'}</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Command Simulation Buttons */}
        {onVoiceTriggerTest && (
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>⚡ Test Voice Wake Words:</span>
            <button onClick={() => onVoiceTriggerTest('START_NOTES')} className="badge badge-cyan" style={{ cursor: 'pointer', border: 'none' }}>
              Say "Start notes"
            </button>
            <button onClick={() => onVoiceTriggerTest('STOP_NOTES')} className="badge badge-rose" style={{ cursor: 'pointer', border: 'none' }}>
              Say "Stop notes"
            </button>
            <button onClick={() => onVoiceTriggerTest('TAKE_PHOTO')} className="badge badge-emerald" style={{ cursor: 'pointer', border: 'none' }}>
              Say "Take photo"
            </button>
            <button onClick={() => onVoiceTriggerTest('CAPTURE_SCREEN')} className="badge badge-amber" style={{ cursor: 'pointer', border: 'none' }}>
              Say "Capture diagram"
            </button>
          </div>
        )}
      </div>

      {/* Real-time Live Transcript Stream Box + Quick Speech Input */}
      <div className="card" style={{ background: 'var(--bg-secondary)', minHeight: '220px', maxHeight: '340px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileAudio size={16} color="var(--accent-cyan-light)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              Live Spoken Lecture Transcript Stream
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {transcript.length} speech segments • Notes update live below
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.5rem' }}>
          {transcript.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Microphone is ready for speech.
                </p>
                <p style={{ fontSize: '0.8rem' }}>
                  Say <strong style={{ color: 'var(--accent-cyan-light)' }}>"Start notes"</strong> or click Start Notes above to speak.
                </p>
              </div>
            </div>
          ) : (
            transcript.map((seg, idx) => (
              <div 
                key={seg.id || idx}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  fontSize: '0.875rem'
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan-light)',
                  fontWeight: 600,
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  [{Math.floor(seg.timestamp / 60)}:{(seg.timestamp % 60).toString().padStart(2, '0')}]
                </span>
                <div>
                  <strong style={{ color: 'var(--accent-emerald-light)', marginRight: '0.5rem', fontSize: '0.8rem' }}>
                    {seg.speaker || 'Speaker'}:
                  </strong>
                  <span style={{ color: 'var(--text-primary)' }}>{seg.text}</span>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Dictate / Add sentence form */}
        <form onSubmit={handleManualAdd} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <input
            type="text"
            value={manualInputText}
            onChange={(e) => setManualInputText(e.target.value)}
            placeholder="Type or paste lecture speech here if mic is quiet..."
            style={{
              flex: 1,
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.825rem'
            }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
            Add to Notes
          </button>
        </form>
      </div>
    </div>
  );
};
