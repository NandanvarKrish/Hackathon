import React, { useEffect, useRef, useState } from 'react';
import { SmartNote } from '../types/notes';
import { Mic, FileText, Sparkles, Loader, Copy, Check } from 'lucide-react';

interface LiveNotePanelProps {
  notes: SmartNote | undefined;
  isRecording: boolean;
  isGenerating: boolean;
  rawTranscript: string;
}

export const LiveNotePanel: React.FC<LiveNotePanelProps> = ({
  notes,
  isRecording,
  isGenerating,
  rawTranscript
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes?.sections?.length, notes?.keyTakeaways?.length]);

  // Build clean copyable markdown from notes
  const buildMarkdown = (): string => {
    if (!notes) return rawTranscript || '';
    let md = `# ${notes.title}\n\n`;
    if (notes.executiveSummary) {
      md += `## Summary\n${notes.executiveSummary}\n\n`;
    }
    if (notes.keyTakeaways?.length) {
      md += `## Key Points\n`;
      notes.keyTakeaways.forEach(t => { md += `- ${t}\n`; });
      md += '\n';
    }
    if (notes.sections?.length) {
      md += `## Notes\n\n`;
      notes.sections.forEach(sec => {
        md += `### ${sec.title}\n`;
        if (sec.content) md += `${sec.content}\n\n`;
        if (sec.bulletPoints?.length) {
          sec.bulletPoints.forEach(b => { md += `- ${b}\n`; });
          md += '\n';
        }
        if (sec.keyFormula) md += `**Formula:** \`${sec.keyFormula}\`\n\n`;
      });
    }
    if (notes.keyTerms?.length) {
      md += `## Glossary\n`;
      notes.keyTerms.forEach(t => { md += `- **${t.term}**: ${t.definition}\n`; });
      md += '\n';
    }
    if (notes.actionItems?.length) {
      md += `## Action Items\n`;
      notes.actionItems.forEach(a => { md += `- [${a.completed ? 'x' : ' '}] ${a.text}\n`; });
    }
    return md.trim();
  };

  const handleCopy = () => {
    const md = buildMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEmpty = !notes && !rawTranscript;

  return (
    <div
      className="card"
      style={{
        background: 'var(--bg-secondary)',
        border: isRecording
          ? '1.5px solid var(--accent-rose)'
          : '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '480px',
        maxHeight: '700px',
        transition: 'border-color 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-cyan-light)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Live Note Writer</h3>
          {isRecording && (
            <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>
              ● Writing Live
            </span>
          )}
          {isGenerating && (
            <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
              ✦ Finalizing
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isGenerating && (
            <Loader size={15} color="var(--accent-cyan-light)" style={{ animation: 'spin 1s linear infinite' }} />
          )}
          {/* Copy button - always available */}
          {(notes || rawTranscript) && (
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
              title="Copy structured notes as Markdown"
            >
              {copied
                ? <><Check size={13} color="#10b981" /> Copied!</>
                : <><Copy size={13} /> Copy Notes</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Standby empty state */}
      {isEmpty && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <Mic size={36} color="rgba(148,163,184,0.2)" />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            Notes will write here as you speak
          </p>
          <p style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
            Enable voice commands and say{' '}
            <strong style={{ color: 'var(--accent-cyan-light)' }}>"Start notes"</strong>
            {' '}or click <strong>Start Notes</strong> on the left.
          </p>
        </div>
      )}

      {/* Scrollable note content */}
      {!isEmpty && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          paddingRight: '0.3rem',
          userSelect: 'text' // make text selectable for manual copy
        }}>

          {/* 🟥 Live speech stream (raw, before NLP) */}
          {isRecording && rawTranscript && (
            <div style={{
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(225, 29, 72, 0.07)',
              border: '1px solid rgba(225, 29, 72, 0.2)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.65'
            }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                color: 'var(--accent-rose-light)',
                display: 'block', marginBottom: '0.25rem',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                🎙️ Hearing
              </span>
              {rawTranscript.slice(-250)}
              <span style={{
                display: 'inline-block', width: '2px', height: '13px',
                background: 'var(--accent-cyan-light)', marginLeft: '3px',
                verticalAlign: 'middle', animation: 'blink-cursor 0.8s step-end infinite'
              }} />
            </div>
          )}

          {/* Title */}
          {notes?.title && (
            <h2 style={{
              fontSize: '1.15rem', fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.01em',
              lineHeight: '1.4', paddingBottom: '0.4rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              {notes.title}
              {isRecording && (
                <span style={{ color: 'var(--accent-rose-light)', fontSize: '0.72rem', fontWeight: 400, marginLeft: '0.5rem' }}>
                  writing live...
                </span>
              )}
            </h2>
          )}

          {/* Executive Summary */}
          {notes?.executiveSummary && (
            <section>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--accent-cyan-light)', textTransform: 'uppercase',
                marginBottom: '0.35rem'
              }}>
                ✦ Summary
              </div>
              <p style={{
                fontSize: '0.88rem', lineHeight: '1.7',
                color: 'var(--text-secondary)',
                padding: '0.6rem 0.85rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--accent-cyan-light)'
              }}>
                {notes.executiveSummary}
                {isRecording && (
                  <span style={{
                    display: 'inline-block', width: '2px', height: '12px',
                    background: 'var(--accent-cyan-light)', marginLeft: '3px',
                    verticalAlign: 'middle', animation: 'blink-cursor 0.8s step-end infinite'
                  }} />
                )}
              </p>
            </section>
          )}

          {/* Key Bullet Points */}
          {notes?.keyTakeaways && notes.keyTakeaways.length > 0 && (
            <section>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--accent-emerald-light)', textTransform: 'uppercase',
                marginBottom: '0.4rem'
              }}>
                🎯 Key Points
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {notes.keyTakeaways.map((t, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                    fontSize: '0.86rem', color: 'var(--text-secondary)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.06)',
                    lineHeight: '1.55'
                  }}>
                    <span style={{ color: 'var(--accent-emerald-light)', flexShrink: 0, marginTop: '1px' }}>•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Note Sections */}
          {notes?.sections && notes.sections.length > 0 && (
            <section>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--accent-amber-light)', textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}>
                📑 Notes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {notes.sections.map((sec, idx) => (
                  <div key={sec.id || idx} style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: sec.id === 'sec-live'
                      ? 'rgba(225, 29, 72, 0.06)'
                      : 'var(--bg-tertiary)',
                    border: sec.id === 'sec-live'
                      ? '1px solid rgba(225, 29, 72, 0.25)'
                      : '1px solid var(--border-subtle)',
                  }}>
                    {/* Section title */}
                    <div style={{
                      fontSize: '0.82rem', fontWeight: 700,
                      color: sec.id === 'sec-live' ? 'var(--accent-rose-light)' : 'var(--text-primary)',
                      marginBottom: '0.4rem',
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}>
                      {sec.title}
                      {sec.id === 'sec-live' && isRecording && (
                        <span style={{
                          display: 'inline-block', width: '2px', height: '11px',
                          background: 'var(--accent-rose-light)',
                          animation: 'blink-cursor 0.8s step-end infinite'
                        }} />
                      )}
                    </div>

                    {/* Content paragraph */}
                    {sec.content && (
                      <p style={{
                        fontSize: '0.82rem', color: 'var(--text-muted)',
                        lineHeight: '1.6', marginBottom: sec.bulletPoints?.length ? '0.45rem' : 0
                      }}>
                        {sec.content.slice(0, 200)}{sec.content.length > 200 ? '...' : ''}
                      </p>
                    )}

                    {/* Bullet points — structured */}
                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {sec.bulletPoints.slice(0, 5).map((b, bi) => (
                          <li key={bi} style={{
                            display: 'flex', gap: '0.4rem', alignItems: 'flex-start',
                            fontSize: '0.8rem', color: 'var(--text-secondary)',
                            lineHeight: '1.5'
                          }}>
                            <span style={{ color: 'var(--accent-cyan-light)', flexShrink: 0, marginTop: '1px' }}>–</span>
                            <span>{b.length > 100 ? b.slice(0, 100) + '...' : b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Formula */}
                    {sec.keyFormula && (
                      <div style={{
                        marginTop: '0.4rem', padding: '0.3rem 0.6rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.77rem', color: 'var(--accent-cyan-light)'
                      }}>
                        ƒ {sec.keyFormula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Glossary */}
          {notes?.keyTerms && notes.keyTerms.length > 0 && (
            <section>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--accent-purple-light)', textTransform: 'uppercase',
                marginBottom: '0.4rem'
              }}>
                📖 Glossary
              </div>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {notes.keyTerms.map((item, i) => (
                  <div key={i} style={{
                    padding: '0.4rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(124, 58, 237, 0.07)',
                    fontSize: '0.82rem'
                  }}>
                    <dt style={{ fontWeight: 700, color: 'var(--accent-purple-light)', display: 'inline' }}>
                      {item.term}:{' '}
                    </dt>
                    <dd style={{ color: 'var(--text-muted)', display: 'inline' }}>
                      {item.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* AI generating footer */}
      {isGenerating && (
        <div style={{
          marginTop: '0.75rem', padding: '0.6rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: '0.82rem', color: 'var(--accent-cyan-light)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <Sparkles size={14} />
          Structuring full notes with AI...
        </div>
      )}
    </div>
  );
};
