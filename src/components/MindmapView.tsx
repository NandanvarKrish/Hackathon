import React, { useState } from 'react';
import { MindmapData, MindmapNode } from '../types/notes';
import { GitFork, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface MindmapViewProps {
  mindmap?: MindmapData;
  lectureTitle: string;
}

const MindmapViewComponent: React.FC<MindmapViewProps> = ({ mindmap, lectureTitle }) => {
  const { announce } = useAccessibility();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});

  if (!mindmap || !mindmap.root) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <p>No mindmap data available yet. Generate smart notes to automatically create a concept tree.</p>
      </div>
    );
  }

  const toggleBranch = (id: string) => {
    setCollapsedBranches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Ribbon */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-amber">Visual Concept Architecture</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interactive Hierarchical Concept Graph
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {lectureTitle} - Mindmap
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
            className="btn btn-secondary btn-icon"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
            className="btn btn-secondary btn-icon"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="btn btn-secondary btn-icon"
            title="Reset zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Interactive Mindmap Canvas Board */}
      <div className="card" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        minHeight: '520px',
        overflow: 'auto',
        padding: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2.5rem',
          width: '100%',
          maxWidth: '1100px'
        }}>
          {/* Root Central Node */}
          <div style={{
            padding: '1.25rem 2.5rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.35rem',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.4)',
            textAlign: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            position: 'relative'
          }}>
            <span>{mindmap.root.label}</span>
            {mindmap.root.description && (
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, opacity: 0.9, marginTop: '0.25rem' }}>
                {mindmap.root.description}
              </span>
            )}
          </div>

          {/* Sub-Branches Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${mindmap.root.children?.length || 3}, minmax(240px, 1fr))`,
            gap: '1.75rem',
            width: '100%'
          }}>
            {mindmap.root.children?.map((branch, bIdx) => {
              const isCollapsed = collapsedBranches[branch.id || String(bIdx)];
              const colors = [
                { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.4)', text: 'var(--accent-cyan-light)' },
                { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', text: 'var(--accent-emerald-light)' },
                { bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.4)', text: 'var(--accent-purple-light)' },
                { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.4)', text: 'var(--accent-rose-light)' },
              ];
              const color = colors[bIdx % colors.length];

              return (
                <div
                  key={branch.id || bIdx}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div 
                    onClick={() => toggleBranch(branch.id || String(bIdx))}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <strong style={{ color: color.text, fontSize: '1.05rem', fontWeight: 700 }}>
                      {branch.label}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isCollapsed ? 'Expand +' : 'Collapse −'}
                    </span>
                  </div>

                  {branch.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {branch.description}
                    </p>
                  )}

                  {!isCollapsed && branch.children && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.4rem' }}>
                      {branch.children.map((leaf, lIdx) => (
                        <div
                          key={leaf.id || lIdx}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <span style={{ color: color.text }}>•</span>
                          <span>{leaf.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MindmapView = React.memo(MindmapViewComponent);
