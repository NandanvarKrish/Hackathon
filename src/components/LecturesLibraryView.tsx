import React, { useState } from 'react';
import { LectureSession } from '../types/notes';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Download, 
  PlusCircle, 
  Clock, 
  Mic, 
  FileText, 
  Layers, 
  Camera, 
  Play 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface LecturesLibraryViewProps {
  lectures: LectureSession[];
  onSelectLecture: (id: string) => void;
  onDeleteLecture: (id: string) => void;
  onNewLecture: () => void;
  onOpenExportModal: (lecture: LectureSession) => void;
}

export const LecturesLibraryView: React.FC<LecturesLibraryViewProps> = ({
  lectures,
  onSelectLecture,
  onDeleteLecture,
  onNewLecture,
  onOpenExportModal
}) => {
  const { announce } = useAccessibility();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extract unique subjects
  const subjects = Array.from(new Set(lectures.map(l => l.subject || 'General'))).filter(Boolean);

  const filteredLectures = lectures.filter(l => {
    const matchesSearch = 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.rawTranscript.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === 'all' || l.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header ribbon */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.18), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-cyan">Saved Lecture Library</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lectures.length} saved sessions
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Lecture Sessions Library
          </h1>
        </div>

        <button onClick={onNewLecture} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>New Lecture Session</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across all lectures, transcripts, and subjects..."
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}
        >
          <option value="all">All Subjects ({lectures.length})</option>
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Lecture List Grid */}
      {filteredLectures.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No lectures match your filter.
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Try searching for a different keyword or start a new live lecture session.
          </p>
          <button onClick={onNewLecture} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create New Session</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredLectures.map((lec) => (
            <div
              key={lec.id}
              className="card"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                      {lec.subject || 'Academic'}
                    </span>
                    {lec.isDemo && (
                      <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                        Demo Sample
                      </span>
                    )}
                  </div>
                  <h3 
                    onClick={() => { onSelectLecture(lec.id); announce(`Opening lecture: ${lec.title}`); }}
                    style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    {lec.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📅 {lec.date}
                  </span>
                </div>

                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--accent-cyan-light)',
                  fontWeight: 600
                }}>
                  ⏱️ {Math.floor((lec.duration || 0) / 60)}m {(lec.duration || 0) % 60}s
                </span>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {lec.notes?.executiveSummary || 'Live spoken transcript captured.'}
              </p>

              <div style={{
                marginTop: 'auto',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', gap: '0.65rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>📑 {lec.notes?.sections?.length || 0} sections</span>
                  <span>📸 {lec.media?.length || 0} slides</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => onSelectLecture(lec.id)}
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    <span>Open Notes</span>
                  </button>
                  <button
                    onClick={() => onOpenExportModal(lec)}
                    className="btn btn-secondary btn-icon"
                    title="Export study material"
                  >
                    <Download size={14} />
                  </button>
                  {!lec.isDemo && (
                    <button
                      onClick={() => onDeleteLecture(lec.id)}
                      className="btn btn-secondary btn-icon"
                      title="Delete lecture"
                    >
                      <Trash2 size={14} color="var(--accent-rose-light)" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
