import React, { useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Smile, 
  Layers, 
  HelpCircle, 
  GitFork, 
  Volume2, 
  MessageSquare, 
  Copy 
} from 'lucide-react';
import { ContextMenuState } from '../types/notes';
import { useAccessibility } from '../context/AccessibilityContext';

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  onSelectAction: (action: 'summary' | 'eli5' | 'flashcards' | 'quiz' | 'mindmap' | 'speak' | 'askAi') => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  onSelectAction
}) => {
  const { announce } = useAccessibility();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      announce("Smart context menu opened. Select an AI tool.");
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.visible]);

  if (!state.visible) return null;

  // Keep menu within viewport bounds
  const posX = Math.min(state.x, window.innerWidth - 260);
  const posY = Math.min(state.y, window.innerHeight - 340);

  const menuItems = [
    { id: 'summary', label: '⚡ 3-Bullet Smart Summary', icon: Sparkles, color: 'var(--accent-cyan-light)' },
    { id: 'eli5', label: '👶 Explain Like I\'m 5', icon: Smile, color: 'var(--accent-amber-light)' },
    { id: 'flashcards', label: '🗂️ Generate Flashcards', icon: Layers, color: 'var(--accent-emerald-light)' },
    { id: 'quiz', label: '❓ Practice Quiz (3 Questions)', icon: HelpCircle, color: 'var(--accent-purple-light)' },
    { id: 'mindmap', label: '🗺️ Visual Concept Mindmap', icon: GitFork, color: 'var(--accent-rose-light)' },
    { id: 'speak', label: '🔊 Read Aloud Selection', icon: Volume2, color: 'var(--text-primary)' },
    { id: 'askAi', label: '💬 Ask AI About This', icon: MessageSquare, color: 'var(--accent-cyan-light)' },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Smart Note Context Menu"
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        zIndex: 1000,
        width: '250px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '0.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div style={{
        padding: '0.4rem 0.65rem 0.35rem',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '0.2rem'
      }}>
        EchoNote Instant AI Tools
      </div>

      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            role="menuitem"
            onClick={() => {
              onSelectAction(item.id as any);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.825rem',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            <Icon size={15} color={item.color} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
