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
  Power,
  LayoutDashboard,
  BookOpen,
  Activity,
  Search,
  Sparkles
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ActiveViewType } from '../types/notes';

interface HeaderProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
  isVoiceListening: boolean;
  isRecording: boolean;
  onNewLecture: () => void;
  onOpenApiKeyModal: () => void;
  onOpenSearchModal: () => void;
  onStartDemoMode: () => void;
  hasApiKey: boolean;
  lectureTitle: string;
  onToggleVoiceActivation: () => void;
  lastHeardPhrase: string;
  isDemoMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  isVoiceListening,
  isRecording,
  onNewLecture,
  onOpenApiKeyModal,
  onOpenSearchModal,
  onStartDemoMode,
  hasApiKey,
  lectureTitle,
  onToggleVoiceActivation,
  lastHeardPhrase,
  isDemoMode = false
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
      {/* Demo Mode Banner if active */}
      {isDemoMode && (
        <div style={{
          background: 'linear-gradient(90deg, #d97706, #0284c7)',
          padding: '0.35rem 1rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={14} />
          <span>JUDGE DEMO MODE ACTIVE — Running 3-Minute Simulated Lecture Stream & Pre-Loaded Multimodal Data</span>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand & Active Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div 
            onClick={() => setActiveView('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
          >
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
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                  Smart Lecture Companion
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lectureTitle || 'AI Lecture Suite'}
              </p>
            </div>
          </div>

          {/* Voice Activation Switch (ON / OFF) */}
          <button 
            onClick={onToggleVoiceActivation}
            title={isVoiceListening ? "Voice Commands are ON. Click to turn OFF." : "Voice Commands are OFF. Click to turn ON."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: isRecording 
                ? 'rgba(225, 29, 72, 0.15)' 
                : isVoiceListening 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'var(--bg-tertiary)',
              border: `1px solid ${isRecording ? 'var(--accent-rose)' : isVoiceListening ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isRecording ? 'var(--accent-rose-light)' : isVoiceListening ? 'var(--accent-emerald-light)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Power size={13} color={isRecording ? 'var(--accent-rose-light)' : isVoiceListening ? 'var(--accent-emerald-light)' : 'var(--text-muted)'} />
            <span>
              {isRecording 
                ? '🔴 Recording Notes' 
                : isVoiceListening 
                ? '🎙️ Voice Wake Word: ON' 
                : '🎙️ Voice Wake Word: OFF'}
            </span>
          </button>

          {lastHeardPhrase && isVoiceListening && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              🗣️ <em>"{lastHeardPhrase}"</em>
            </span>
          )}
        </div>

        {/* Accessibility & Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Global Search Button */}
          <button
            onClick={onOpenSearchModal}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Global Search (Ctrl+K)"
          >
            <Search size={14} color="var(--accent-cyan-light)" />
            <span>Search</span>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>Ctrl+K</span>
          </button>

          {/* Judge Demo Button */}
          <button
            onClick={onStartDemoMode}
            className="btn btn-emerald"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Start automated 3-minute hackathon judge demo"
          >
            <Activity size={14} />
            <span>Demo Mode</span>
          </button>

          {/* New Lecture Button */}
          <button 
            onClick={onNewLecture}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Create or record another lecture"
          >
            <PlusCircle size={14} />
            <span>New Session</span>
          </button>

          {/* Dyslexia Font Toggle */}
          <button
            onClick={toggleDyslexiaFont}
            className={`btn btn-secondary ${dyslexiaFont ? 'btn-primary' : ''}`}
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            title="Toggle Dyslexia-friendly Lexend font"
            aria-pressed={dyslexiaFont}
          >
            <Type size={13} />
            <span>Font</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`btn btn-secondary ${highContrast ? 'btn-primary' : ''}`}
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            title="Toggle High Contrast Mode"
            aria-pressed={highContrast}
          >
            <Eye size={13} />
            <span>{highContrast ? 'Contrast: On' : 'Contrast'}</span>
          </button>

          {/* Font Scaler */}
          <button
            onClick={cycleFontSize}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            title={`Font size: ${fontSize}`}
          >
            <span>{fontSize.toUpperCase()}</span>
          </button>

          {/* Gemini API Key */}
          <button
            onClick={onOpenApiKeyModal}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            title="Configure Google Gemini API Key"
          >
            <Key size={13} color={hasApiKey ? '#10b981' : '#f59e0b'} />
            <span>{hasApiKey ? 'Gemini' : 'API Key'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        gap: '0.25rem',
        borderTop: '1px solid var(--border-subtle)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveView('dashboard')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'dashboard' ? '3px solid var(--accent-cyan-light)' : '3px solid transparent',
            color: activeView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <LayoutDashboard size={15} color={activeView === 'dashboard' ? 'var(--accent-cyan-light)' : 'currentColor'} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveView('live')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'live' ? '3px solid var(--accent-rose-light)' : '3px solid transparent',
            color: activeView === 'live' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Mic size={15} color={activeView === 'live' ? 'var(--accent-rose-light)' : 'currentColor'} />
          <span>Live Recording</span>
          {isRecording && <span className="badge badge-rose" style={{ fontSize: '0.6rem' }}>REC</span>}
        </button>

        <button
          onClick={() => setActiveView('notes')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'notes' ? '3px solid var(--accent-cyan-light)' : '3px solid transparent',
            color: activeView === 'notes' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={15} color={activeView === 'notes' ? 'var(--accent-cyan-light)' : 'currentColor'} />
          <span>Smart Notes</span>
        </button>

        <button
          onClick={() => setActiveView('timeline')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'timeline' ? '3px solid var(--accent-cyan-light)' : '3px solid transparent',
            color: activeView === 'timeline' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Activity size={15} color={activeView === 'timeline' ? 'var(--accent-cyan-light)' : 'currentColor'} />
          <span>Lecture Timeline</span>
        </button>

        <button
          onClick={() => setActiveView('podcast')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'podcast' ? '3px solid var(--accent-rose-light)' : '3px solid transparent',
            color: activeView === 'podcast' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Radio size={15} color={activeView === 'podcast' ? 'var(--accent-rose-light)' : 'currentColor'} />
          <span>Podcast Studio</span>
        </button>

        <button
          onClick={() => setActiveView('media')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'media' ? '3px solid var(--accent-emerald-light)' : '3px solid transparent',
            color: activeView === 'media' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <ImageIcon size={15} color={activeView === 'media' ? 'var(--accent-emerald-light)' : 'currentColor'} />
          <span>Slide OCR Vision</span>
        </button>

        <button
          onClick={() => setActiveView('mindmap')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'mindmap' ? '3px solid var(--accent-amber-light)' : '3px solid transparent',
            color: activeView === 'mindmap' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <GitFork size={15} color={activeView === 'mindmap' ? 'var(--accent-amber-light)' : 'currentColor'} />
          <span>Mindmap</span>
        </button>

        <button
          onClick={() => setActiveView('library')}
          style={{
            padding: '0.75rem 1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'library' ? '3px solid var(--accent-purple-light)' : '3px solid transparent',
            color: activeView === 'library' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          <BookOpen size={15} color={activeView === 'library' ? 'var(--accent-purple-light)' : 'currentColor'} />
          <span>Library</span>
        </button>
      </div>
    </header>
  );
};
