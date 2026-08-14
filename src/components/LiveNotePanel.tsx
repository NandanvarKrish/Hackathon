import React, { useEffect, useRef, useState } from 'react';
import { SmartNote } from '../types/notes';
import { Mic, FileText, Sparkles, Copy, Check } from 'lucide-react';

interface LiveNotePanelProps {
  notes: SmartNote | undefined;
  isRecording: boolean;
  isGenerating: boolean;
  rawTranscript: string;
}

const LiveNotePanelComponent: React.FC<LiveNotePanelProps> = ({
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
        md += `${sec.content}\n\n`;
      });
    }
    return md;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{
      background: 'var(--bg-secondary)',
      border: isRecording ? '1px solid rgba(225, 29, 72, 0.4)' : '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '480px',
      maxHeight: '780px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-cyan-light)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Live Note Writer
          </h2>
          {isRecording && (
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', animation: 'pulse 1.5s infinite' }}>
              🔴 LIVE
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          title="Copy formatted markdown"
        >
          {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Content Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '0.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {!notes && !rawTranscript ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <Mic size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
              Waiting to capture lecture speech...
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click <strong>Start Notes</strong> or say <em>"Start notes"</em> to write live structured notes on screen.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title */}
            {notes?.title && (
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan-light)', margin: 0 }}>
                {notes.title}
              </h3>
            )}

            {/* Executive Summary */}
            {notes?.executiveSummary && (
              <div style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.08)',
                borderLeft: '3px solid var(--accent-cyan-light)',
                fontSize: '0.88rem',
                lineHeight: '1.6',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-cyan-light)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  ⚡ Executive Summary
                </strong>
                {notes.executiveSummary}
              </div>
            )}

            {/* Key Takeaways */}
            {notes?.keyTakeaways && notes.keyTakeaways.length > 0 && (
              <div style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)'
              }}>
                <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-emerald-light)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  🎯 Key Points
                </strong>
                <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {notes.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections */}
            {notes?.sections && notes.sections.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {notes.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: sec.id === 'sec-live' ? 'rgba(225, 29, 72, 0.08)' : 'var(--bg-tertiary)',
                      border: `1px solid ${sec.id === 'sec-live' ? 'var(--accent-rose)' : 'var(--border-subtle)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {sec.title}
                      </h4>
                      {sec.id === 'sec-live' && (
                        <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>
                          Streaming
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                      {sec.content}
                    </p>

                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {sec.bulletPoints.map((bp, bpIdx) => (
                          <li key={bpIdx}>{bp}</li>
                        ))}
                      </ul>
                    )}

                    {sec.keyFormula && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-primary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-cyan-light)'
                      }}>
                        ƒ {sec.keyFormula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Glossary terms */}
            {notes?.keyTerms && notes.keyTerms.length > 0 && (
              <section aria-labelledby="glossary-heading">
                <strong id="glossary-heading" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-purple-light)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  📖 Glossary Terms
                </strong>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {notes.keyTerms.map((kt, idx) => (
                    <div key={idx} style={{ padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                      <dt style={{ color: 'var(--accent-cyan-light)', fontWeight: 700, fontSize: '0.8rem' }}>{kt.term}</dt>
                      <dd style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{kt.definition}</dd>
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
    </div>
  );
};

export const LiveNotePanel = React.memo(LiveNotePanelComponent);
