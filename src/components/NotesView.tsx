import React, { useState } from 'react';
import { 
  SmartNote, 
  LectureMedia 
} from '../types/notes';
import { 
  Sparkles, 
  CheckSquare, 
  Square, 
  BookOpen, 
  Printer, 
  Radio, 
  GitFork, 
  Layers, 
  Copy,
  Check,
  Edit3,
  Mic
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface NotesViewProps {
  notes: SmartNote;
  media: LectureMedia[];
  onOpenPodcast: () => void;
  onOpenMindmap: () => void;
  onToggleActionItem: (id: string) => void;
  onContextMenuTrigger: (e: React.MouseEvent, sectionText: string, sectionId?: string) => void;
  isRecording?: boolean;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  media,
  onOpenPodcast,
  onOpenMindmap,
  onToggleActionItem,
  onContextMenuTrigger,
  isRecording = false
}) => {
  const { announce } = useAccessibility();
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    let md = `# ${notes.title}\n\n`;
    md += `## Executive Summary\n${notes.executiveSummary}\n\n`;
    md += `## Key Takeaways\n${notes.keyTakeaways.map(t => `- ${t}`).join('\n')}\n\n`;
    md += `## Lecture Breakdown\n`;
    notes.sections.forEach(s => {
      md += `\n### ${s.title}\n${s.content}\n`;
      if (s.bulletPoints && s.bulletPoints.length) {
        md += s.bulletPoints.map(b => `* ${b}`).join('\n') + '\n';
      }
      if (s.keyFormula) md += `\n**Formula:** \`${s.keyFormula}\`\n`;
    });
    md += `\n## Action Items\n`;
    notes.actionItems.forEach(a => {
      md += `- [${a.completed ? 'x' : ' '}] ${a.text}\n`;
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    announce("Full markdown notes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
    announce("Opening print dialog for accessible PDF export");
  };

  return (
    <div id="notes-view-root" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner & Quick Tool Ribbon */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span className={`badge ${isRecording ? 'badge-rose' : 'badge-cyan'}`}>
              {isRecording ? '🔴 Live Note Writer Active' : 'Structured Study Note'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 Right-click any section for instant Smart Summary & Flashcards
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {notes.title}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={onOpenPodcast} className="btn btn-rose">
            <Radio size={16} />
            <span>Launch Podcast Mode</span>
          </button>
          <button onClick={onOpenMindmap} className="btn btn-secondary">
            <GitFork size={16} />
            <span>Mindmap</span>
          </button>
          <button onClick={handleCopyMarkdown} className="btn btn-secondary">
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
          <button onClick={handlePrint} className="btn btn-secondary" title="Export as PDF or Print">
            <Printer size={16} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Live AI Note Writer Status Banner if Recording */}
      {isRecording && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(225, 29, 72, 0.12)',
          border: '1px solid var(--accent-rose)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          color: 'var(--accent-rose-light)'
        }}>
          <div className="pulse-ring" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-rose)' }} />
          <div>
            <strong>AI Note Writer Active:</strong> Listening to your lecture voice and structuring notes, bullet points, and formulas live inside this document...
          </div>
        </div>
      )}

      {/* Executive Summary & Key Takeaways Card */}
      <div 
        className="card"
        onContextMenu={(e) => onContextMenuTrigger(e, notes.executiveSummary, 'exec-summary')}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} color="var(--accent-cyan-light)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Executive Summary & Thesis
          </h2>
        </div>

        <p style={{
          fontSize: '1.05rem',
          lineHeight: '1.7',
          color: 'var(--text-secondary)',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid var(--accent-cyan-light)'
        }}>
          {notes.executiveSummary}
          {isRecording && <span style={{ color: 'var(--accent-cyan-light)', animation: 'pulse-wave 1s infinite' }}> ✍️</span>}
        </p>

        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
          🎯 Key Takeaways:
        </h3>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', listStyle: 'none' }}>
          {notes.keyTakeaways.map((takeaway, idx) => (
            <li
              key={idx}
              onContextMenu={(e) => onContextMenuTrigger(e, takeaway, `takeaway-${idx}`)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}
            >
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.2)',
                color: 'var(--accent-cyan-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {idx + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timestamped Lecture Sections with Integrated Whiteboard OCR Slides */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--accent-cyan-light)" />
          <span>Structured Note Sections</span>
        </h2>

        {notes.sections.map((section, idx) => {
          const attachedMedia = media.find(m => m.id === section.mediaId) || (idx === 0 && media.length > 0 ? media[0] : null);

          return (
            <div
              key={section.id || idx}
              onContextMenu={(e) => onContextMenuTrigger(e, `${section.title}: ${section.content}`, section.id)}
              className="card"
              style={{
                background: 'var(--bg-secondary)',
                border: section.id === 'sec-live' ? '1px solid var(--accent-rose)' : '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {section.title}
                  </h3>
                  {section.id === 'sec-live' && isRecording && (
                    <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Live Active Section</span>
                  )}
                </div>

                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-cyan-light)',
                  fontWeight: 600
                }}>
                  ⏱️ {Math.floor(section.timestamp / 60)}:{(section.timestamp % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Main Content Paragraph */}
              <p style={{ fontSize: '0.975rem', lineHeight: '1.75', color: 'var(--text-secondary)' }}>
                {section.content}
                {section.id === 'sec-live' && isRecording && (
                  <span style={{ color: 'var(--accent-cyan-light)', fontWeight: 700 }}> |</span>
                )}
              </p>

              {/* Bullet Points */}
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                  {section.bulletPoints.map((point, pIdx) => (
                    <li key={pIdx}>{point}</li>
                  ))}
                </ul>
              )}

              {/* Key Mathematical Formula if present */}
              {section.keyFormula && (
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  color: 'var(--accent-cyan-light)',
                  overflowX: 'auto'
                }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Formula:</strong>
                  <span>{section.keyFormula}</span>
                </div>
              )}

              {/* Attached Whiteboard / Slide Card */}
              {attachedMedia && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'center'
                }}>
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#000000' }}>
                    <img
                      src={attachedMedia.imageUrl}
                      alt={attachedMedia.title}
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '220px', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <span className="badge badge-emerald">Multimodal Vision OCR</span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                      {attachedMedia.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: '1.6' }}>
                      {attachedMedia.aiExplanation}
                    </p>
                    <div style={{
                      padding: '0.4rem 0.65rem',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.775rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-emerald-light)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {attachedMedia.ocrText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Terms Glossary & Action Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Key Terms */}
        <div className="card" style={{ background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-purple-light)" />
            <span>Key Terminology</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notes.keyTerms.map((item, idx) => (
              <div
                key={idx}
                onContextMenu={(e) => onContextMenuTrigger(e, `${item.term}: ${item.definition}`, `term-${idx}`)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <strong style={{ color: 'var(--accent-cyan-light)', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>
                  {item.term}
                </strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items Checklist */}
        <div className="card" style={{ background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={18} color="var(--accent-emerald-light)" />
            <span>Action Items & Exam Prep</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {notes.actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleActionItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: item.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                  border: `1px solid ${item.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {item.completed ? (
                  <CheckSquare size={18} color="var(--accent-emerald-light)" style={{ flexShrink: 0 }} />
                ) : (
                  <Square size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize: '0.9rem',
                  color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: item.completed ? 'line-through' : 'none'
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
