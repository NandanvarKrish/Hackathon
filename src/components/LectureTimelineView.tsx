import React, { useState } from 'react';
import { LectureSession, LectureMedia, NoteSection, TranscriptSegment } from '../types/notes';
import { Activity, Clock, Camera, BookOpen, Mic, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface LectureTimelineViewProps {
  session: LectureSession;
  onSelectTimestamp?: (seconds: number) => void;
}

interface TimelineItem {
  id: string;
  timestamp: number;
  type: 'speech' | 'slide' | 'section' | 'formula';
  title: string;
  content: string;
  speaker?: string;
  media?: LectureMedia;
  formula?: string;
}

export const LectureTimelineView: React.FC<LectureTimelineViewProps> = ({ session, onSelectTimestamp }) => {
  const { announce } = useAccessibility();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'speech' | 'slide' | 'section'>('all');
  const [activeItem, setActiveItem] = useState<TimelineItem | null>(null);

  // Combine speech, slides, sections, and formulas into one unified chronological timeline
  const timelineItems: TimelineItem[] = [];

  // Add transcript segments
  session.transcript?.forEach(seg => {
    timelineItems.push({
      id: `t-${seg.id}`,
      timestamp: seg.timestamp,
      type: 'speech',
      title: `${seg.speaker || 'Lecturer'} Spoke`,
      content: seg.text,
      speaker: seg.speaker
    });
  });

  // Add captured slide media
  session.media?.forEach(m => {
    timelineItems.push({
      id: `m-${m.id}`,
      timestamp: m.timestamp,
      type: 'slide',
      title: `📸 Slide Captured: ${m.title}`,
      content: m.aiExplanation,
      media: m
    });
  });

  // Add note sections & formulas
  session.notes?.sections?.forEach(sec => {
    timelineItems.push({
      id: `s-${sec.id}`,
      timestamp: sec.timestamp,
      type: 'section',
      title: `📑 Concept: ${sec.title}`,
      content: sec.content,
      formula: sec.keyFormula
    });
  });

  // Sort by timestamp
  timelineItems.sort((a, b) => a.timestamp - b.timestamp);

  const filteredItems = timelineItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header ribbon */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-cyan">Unified Lecture Intelligence</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Speech + Whiteboard OCR + AI Concepts Timeline
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {session.title} — Chronological Timeline
          </h1>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['all', 'speech', 'slide', 'section'] as const).map(flt => (
            <button
              key={flt}
              onClick={() => setSelectedFilter(flt)}
              className={`btn ${selectedFilter === flt ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {flt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div style={{
        position: 'relative',
        paddingLeft: '2.5rem',
        borderLeft: '3px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        margin: '1rem 0'
      }}>
        {filteredItems.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No timeline events recorded yet. Start a lecture or capture slides!
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSlide = item.type === 'slide';
            const isSection = item.type === 'section';
            const isSpeech = item.type === 'speech';

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  setActiveItem(item);
                  if (onSelectTimestamp) onSelectTimestamp(item.timestamp);
                  announce(`Timeline event @ ${formatTime(item.timestamp)}: ${item.title}`);
                }}
                className="card"
                style={{
                  position: 'relative',
                  background: isSlide ? 'rgba(16, 185, 129, 0.08)' : isSection ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-secondary)',
                  border: `1px solid ${isSlide ? 'rgba(16, 185, 129, 0.3)' : isSection ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Node Circle on the left line */}
                <div style={{
                  position: 'absolute',
                  left: '-3.35rem',
                  top: '1.25rem',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSlide ? 'var(--accent-emerald)' : isSection ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  border: '3px solid var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}>
                  {isSlide && <Camera size={13} color="#ffffff" />}
                  {isSection && <BookOpen size={13} color="#ffffff" />}
                  {isSpeech && <Mic size={13} color="var(--accent-cyan-light)" />}
                </div>

                {/* Event Time Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--accent-cyan-light)',
                      fontWeight: 700
                    }}>
                      ⏱️ {formatTime(item.timestamp)}
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </strong>
                  </div>
                  <span className={`badge ${isSlide ? 'badge-emerald' : isSection ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                    {item.type}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {item.content}
                </p>

                {/* Formula pill */}
                {item.formula && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: 'var(--accent-cyan-light)',
                    display: 'inline-block'
                  }}>
                    ƒ {item.formula}
                  </div>
                )}

                {/* Slide Preview thumbnail */}
                {item.media && (
                  <div style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    alignItems: 'center'
                  }}>
                    <img
                      src={item.media.imageUrl}
                      alt={item.media.title}
                      style={{ width: '90px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--accent-emerald-light)', display: 'block' }}>
                        Vision OCR Extracted:
                      </strong>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {item.media.ocrText.slice(0, 90)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
