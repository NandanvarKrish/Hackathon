import React, { useState } from 'react';
import { LectureMedia } from '../types/notes';
import { Camera, Sparkles, Tag, ZoomIn, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface SlideGalleryViewProps {
  media: LectureMedia[];
  onOpenCaptureModal: () => void;
}

const SlideGalleryViewComponent: React.FC<SlideGalleryViewProps> = ({ media, onOpenCaptureModal }) => {
  const { announce } = useAccessibility();
  const [selectedMedia, setSelectedMedia] = useState<LectureMedia | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header ribbon */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-emerald">Multimodal Vision OCR</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {media.length} slides & whiteboard captures
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Lecture Slide & Whiteboard Gallery
          </h1>
        </div>

        <button onClick={onOpenCaptureModal} className="btn btn-emerald">
          <Camera size={16} />
          <span>Snap New Slide</span>
        </button>
      </div>

      {/* Grid of slides */}
      {media.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No visual captures in this lecture yet.
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Use the camera to snap classroom whiteboards, diagrams, and lecture slides with automatic OCR.
          </p>
          <button onClick={onOpenCaptureModal} className="btn btn-emerald">
            <Camera size={16} />
            <span>Open Camera / Upload</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {media.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden',
                padding: '0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Image Preview Container */}
              <div 
                style={{ position: 'relative', width: '100%', height: '220px', background: '#000000', cursor: 'pointer' }}
                onClick={() => { setSelectedMedia(item); announce(`Viewing slide: ${item.title}`); }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  right: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: '#ffffff'
                }}>
                  <ZoomIn size={13} />
                  <span>Enlarge</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan-light)', fontWeight: 600 }}>
                    {Math.floor(item.timestamp / 60)}:{(item.timestamp % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {item.aiExplanation}
                </p>

                {/* OCR Snippet */}
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.775rem',
                  color: 'var(--accent-emerald-light)',
                  whiteSpace: 'pre-wrap'
                }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Transcribed OCR Text:</strong>
                  {item.ocrText}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {item.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enlarged Modal */}
      {selectedMedia && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-secondary)', position: 'relative' }}>
            <button
              onClick={() => setSelectedMedia(null)}
              className="btn btn-secondary btn-icon"
              style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
              {selectedMedia.title}
            </h2>

            <img
              src={selectedMedia.imageUrl}
              alt={selectedMedia.title}
              style={{ width: '100%', maxHeight: '460px', objectFit: 'contain', borderRadius: 'var(--radius-md)', background: '#000000', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong style={{ color: 'var(--accent-cyan-light)', display: 'block', marginBottom: '0.35rem' }}>AI Conceptual Breakdown:</strong>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                  {selectedMedia.aiExplanation}
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--accent-emerald-light)', display: 'block', marginBottom: '0.35rem' }}>Full OCR Transcribed Equations & Formulas:</strong>
                <pre style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--accent-emerald-light)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {selectedMedia.ocrText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SlideGalleryView = React.memo(SlideGalleryViewComponent);
