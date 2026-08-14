import React from 'react';
import { 
  LectureSession, 
  UserAnalytics 
} from '../types/notes';
import { 
  Play, 
  Mic, 
  BookOpen, 
  Award, 
  Clock, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  Activity, 
  ArrowRight, 
  CheckSquare, 
  Trash2, 
  Download, 
  Radio, 
  FileText, 
  PlusCircle 
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface DashboardViewProps {
  analytics: UserAnalytics;
  recentLectures: LectureSession[];
  onStartNewLecture: () => void;
  onSelectLecture: (id: string) => void;
  onDeleteLecture: (id: string) => void;
  onStartDemoMode: () => void;
  onOpenExportModal: (lecture: LectureSession) => void;
  onNavigateView: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  recentLectures,
  onStartNewLecture,
  onSelectLecture,
  onDeleteLecture,
  onStartDemoMode,
  onOpenExportModal,
  onNavigateView
}) => {
  const { announce } = useAccessibility();

  const formatStudyTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = (mins / 60).toFixed(1);
    return mins > 60 ? `${hrs} hrs` : `${mins} mins`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(15, 23, 42, 0.95) 70%)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
              ✦ Live AI Lecture Intelligence
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--accent-emerald-light)', fontWeight: 600 }}>
              Startup Quality & Accessible
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: 'var(--text-primary)'
          }}>
            Your AI Copilot for Every Lecture.
          </h1>

          <p style={{
            fontSize: '1.1rem',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
            marginBottom: '2rem'
          }}>
            EchoNote listens, understands, and continuously transforms spoken lectures and whiteboard slides into structured study notes, 3D flashcards, quizzes, and personalized podcasts.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { onStartNewLecture(); announce('Navigating to Live Lecture Recording'); }}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.45)' }}
            >
              <Mic size={20} />
              <span>Start a Lecture</span>
            </button>

            <button
              onClick={() => { onStartDemoMode(); announce('Launching 3-Minute Judge Demo Mode'); }}
              className="btn btn-emerald"
              style={{ padding: '0.85rem 1.6rem', fontSize: '1.05rem' }}
            >
              <Activity size={20} />
              <span>Explore Judge Demo Mode</span>
            </button>

            <button
              onClick={() => onNavigateView('library')}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.4rem', fontSize: '1rem' }}
            >
              <BookOpen size={18} />
              <span>Browse All Lectures ({analytics.totalLectures})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Learning Analytics Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Metric 1 */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Lectures
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.15)' }}>
              <BookOpen size={18} color="var(--accent-cyan-light)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.totalLectures}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Saved in local workspace
          </span>
        </div>

        {/* Metric 2 */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Study & Listening Time
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)' }}>
              <Clock size={18} color="var(--accent-emerald-light)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatStudyTime(analytics.totalStudyTimeSeconds)}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Captured lecture duration
          </span>
        </div>

        {/* Metric 3 */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Flashcards Mastered
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.15)' }}>
              <Layers size={18} color="var(--accent-rose-light)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {analytics.flashcardsMasteredCount}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Persistent active recall deck
          </span>
        </div>

        {/* Metric 4 */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Quiz Mastery Avg
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(167, 139, 250, 0.15)' }}>
              <Award size={18} color="var(--accent-purple-light)" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald-light)' }}>
            {analytics.quizAveragePercent}%
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Average across practice tests
          </span>
        </div>
      </div>

      {/* Main Dashboard Layout Grid: Recent Lectures + Continue Learning */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1.75rem'
      }}>
        {/* Recent Lectures Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--accent-cyan-light)" />
              <span>Recent Lectures</span>
            </h2>

            <button
              onClick={() => onNavigateView('library')}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentLectures.map((lec) => (
              <div
                key={lec.id}
                className="card"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                        {lec.subject || 'Academic'}
                      </span>
                      {lec.isDemo && (
                        <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                          Demo Sample
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {lec.date}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectLecture(lec.id)}
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {lec.title}
                    </h3>
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
                  {lec.notes?.executiveSummary || 'Spoken lecture transcript captured.'}
                </p>

                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>📑 {lec.notes?.sections?.length || 0} sections</span>
                    <span>📸 {lec.media?.length || 0} slides</span>
                    <span>🗂️ {lec.notes?.flashcards?.length || 0} cards</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => onSelectLecture(lec.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      <span>Open Lecture</span>
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
        </div>

        {/* Continue Learning & Quick Study Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={20} color="var(--accent-emerald-light)" />
            <span>Continue Learning & Revision</span>
          </h2>

          {/* Quick Study Hub Cards */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              ⚡ Interactive Study Tools
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Jump straight into AI-generated revision tools built from your saved lectures.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigateView('podcast')}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', background: 'rgba(225, 29, 72, 0.1)' }}
              >
                <Radio size={18} color="var(--accent-rose-light)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>Podcast Studio</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Conversational Audio</span>
                </div>
              </button>

              <button
                onClick={() => onNavigateView('timeline')}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', background: 'rgba(56, 189, 248, 0.1)' }}
              >
                <Activity size={18} color="var(--accent-cyan-light)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>Lecture Timeline</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speech & Slides</span>
                </div>
              </button>

              <button
                onClick={() => onNavigateView('mindmap')}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', background: 'rgba(245, 158, 11, 0.1)' }}
              >
                <Sparkles size={18} color="var(--accent-amber-light)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>Concept Mindmap</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visual Tree</span>
                </div>
              </button>

              <button
                onClick={() => onNavigateView('media')}
                className="btn btn-secondary"
                style={{ padding: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <Layers size={18} color="var(--accent-emerald-light)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>Slide OCR Gallery</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Whiteboards & Slides</span>
                </div>
              </button>
            </div>
          </div>

          {/* Hackathon Judge Presentation Banner */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} color="var(--accent-emerald-light)" />
              <strong style={{ fontSize: '1rem', color: 'var(--accent-emerald-light)' }}>
                3-Minute Hackathon Demo Script
              </strong>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Presenting to judges? Click <strong>Explore Judge Demo Mode</strong> to experience the complete live workflow with Quantum Computing and Deep Learning samples!
            </p>

            <button
              onClick={onStartDemoMode}
              className="btn btn-emerald"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Play size={16} />
              <span>Launch Live Judge Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
