import React from 'react';
import { 
  Mic, 
  Radio, 
  FileText, 
  Image as ImageIcon, 
  GitFork, 
  Eye, 
  Type, 
  Key, 
  PlusCircle, 
  Volume2,
  Power
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface HeaderProps {
  activeTab: 'notes' | 'podcast' | 'media' | 'mindmap';
  setActiveTab: (tab: 'notes' | 'podcast' | 'media' | 'mindmap') => void;
  isVoiceListening: boolean;
  isRecording: boolean;
  onNewLecture: () => void;
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  lectureTitle: string;
  onToggleVoiceActivation: () => void;
  lastHeardPhrase: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isVoiceListening,
  isRecording,
  onNewLecture,
  onOpenApiKeyModal,
  hasApiKey,
  lectureTitle,
  onToggleVoiceActivation,
  lastHeardPhrase
}) => {
  const { 
    highContrast, 
    toggleHighContrast, 
    dyslexiaFont, 
    toggleDyslexiaFont, 
    fontSize, 
    setFontSize 
  } = useAccessibility();

  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(16px)'
    }}>
      {/* Top Bar */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand & Active Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
            }}>
              <Mic size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  EchoNote <span style={{ color: 'var(--accent-cyan-light)' }}>AI</span>
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  Smart & Accessible
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lectureTitle || 'Automated Lecture Suite'}
              </p>
            </div>
          </div>

          {/* STABLE Voice Activation Switch (ON / OFF) */}
          <button 
            onClick={onToggleVoiceActivation}
            title={isVoiceListening ? "Voice Commands are ON. Click to turn OFF." : "Voice Commands are OFF. Click to turn ON."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: isRecording 
                ? 'rgba(225, 29, 72, 0.15)' 
                : isVoiceListening 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'var(--bg-tertiary)',
              border: `1px solid ${isRecording ? 'var(--accent-rose)' : isVoiceListening ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: isRecording ? 'var(--accent-rose-light)' : isVoiceListening ? 'var(--accent-emerald-light)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Power size={14} color={isRecording ? 'var(--accent-rose-light)' : isVoiceListening ? 'var(--accent-emerald-light)' : 'var(--text-muted)'} />
            <span>
              {isRecording 
                ? '🔴 Recording Notes (Say "Stop notes")' 
                : isVoiceListening 
                ? '🎙️ Voice Wake Word: ON (Say "Start notes")' 
                : '🎙️ Voice Wake Word: OFF (Click to Enable)'}
            </span>
          </button>

          {lastHeardPhrase && isVoiceListening && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              🗣️ Heard: <em>"{lastHeardPhrase}"</em>
            </span>
          )}
        </div>

        {/* Accessibility & Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* New Lecture Button */}
          <button 
            onClick={onNewLecture}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
            title="Create or load another lecture"
          >
            <PlusCircle size={15} />
            <span>New Lecture</span>
          </button>

          {/* Dyslexia Mode Toggle */}
          <button
            onClick={toggleDyslexiaFont}
            className={`btn btn-secondary ${dyslexiaFont ? 'btn-primary' : ''}`}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Toggle Dyslexia-friendly font (Lexend)"
            aria-pressed={dyslexiaFont}
          >
            <Type size={14} />
            <span>Dyslexia Font</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`btn btn-secondary ${highContrast ? 'btn-primary' : ''}`}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Toggle High Contrast Mode for low vision"
            aria-pressed={highContrast}
          >
            <Eye size={14} />
            <span>{highContrast ? 'High Contrast: On' : 'High Contrast'}</span>
          </button>

          {/* Font Scaler */}
          <button
            onClick={cycleFontSize}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title={`Font size: ${fontSize}. Click to scale.`}
          >
            <span>Size: {fontSize.toUpperCase()}</span>
          </button>

          {/* Gemini API Key */}
          <button
            onClick={onOpenApiKeyModal}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Configure Google Gemini API Key"
          >
            <Key size={14} color={hasApiKey ? '#10b981' : '#f59e0b'} />
            <span>{hasApiKey ? 'Gemini Active' : 'API Key'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        gap: '0.5rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'notes' ? '3px solid var(--accent-cyan-light)' : '3px solid transparent',
            color: activeTab === 'notes' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={16} color={activeTab === 'notes' ? 'var(--accent-cyan-light)' : 'currentColor'} />
          <span>Smart Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('podcast')}
          style={{
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'podcast' ? '3px solid var(--accent-rose-light)' : '3px solid transparent',
            color: activeTab === 'podcast' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Radio size={16} color={activeTab === 'podcast' ? 'var(--accent-rose-light)' : 'currentColor'} />
          <span>Podcast Studio (Interactive Audio)</span>
          <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Story / Dual Host</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          style={{
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'media' ? '3px solid var(--accent-emerald-light)' : '3px solid transparent',
            color: activeTab === 'media' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <ImageIcon size={16} color={activeTab === 'media' ? 'var(--accent-emerald-light)' : 'currentColor'} />
          <span>Slide & Whiteboard Vision</span>
        </button>

        <button
          onClick={() => setActiveTab('mindmap')}
          style={{
            padding: '0.85rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'mindmap' ? '3px solid var(--accent-amber-light)' : '3px solid transparent',
            color: activeTab === 'mindmap' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <GitFork size={16} color={activeTab === 'mindmap' ? 'var(--accent-amber-light)' : 'currentColor'} />
          <span>Concept Mindmap</span>
        </button>
      </div>
    </header>
  );
};
