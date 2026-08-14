import React from 'react';
import { Download, FileText, Layers, Printer, X, FileCode, Package } from 'lucide-react';
import { LectureSession, ExportFormatType } from '../types/notes';
import { exportLectureData, downloadFile } from '../services/storageService';
import { useAccessibility } from '../context/AccessibilityContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: LectureSession | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  lecture
}) => {
  const { announce } = useAccessibility();

  if (!isOpen || !lecture) return null;

  const handleExport = (format: ExportFormatType) => {
    const { filename, content, mimeType } = exportLectureData(lecture, format);
    downloadFile(filename, content, mimeType);
    announce(`Exported lecture material as ${format.toUpperCase()}`);
  };

  const handlePrintPdf = () => {
    window.print();
    announce("Opening print dialog for PDF export");
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 140,
      padding: '1.5rem'
    }}>
      <div 
        role="dialog"
        aria-labelledby="export-modal-title"
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          className="btn btn-secondary btn-icon"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          aria-label="Close export modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Download size={22} color="var(--accent-cyan-light)" />
          </div>
          <div>
            <h2 id="export-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Export Study Material
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Export "{lecture.title}" into standard formats.
            </p>
          </div>
        </div>

        {/* Export Options Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => handleExport('md')}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)' }}
          >
            <FileText size={18} color="var(--accent-cyan-light)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Smart Notes (Markdown .md)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes summary, key takeaways, sections, formulas & glossary</span>
            </div>
          </button>

          <button
            onClick={() => handleExport('txt')}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)' }}
          >
            <FileCode size={18} color="var(--accent-emerald-light)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Transcript & Audio Stream (.txt)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timestamped verbatim transcript stream</span>
            </div>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)' }}
          >
            <Layers size={18} color="var(--accent-rose-light)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Flashcards Deck (.csv)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compatible with Anki, Quizlet, and Excel</span>
            </div>
          </button>

          <button
            onClick={() => handleExport('json')}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)' }}
          >
            <Package size={18} color="var(--accent-amber-light)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Complete Lecture Package (.json)</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full raw backup of notes, transcript, slides OCR, and quizzes</span>
            </div>
          </button>

          <button
            onClick={handlePrintPdf}
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', background: 'var(--bg-tertiary)' }}
          >
            <Printer size={18} color="var(--accent-purple-light)" />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Print / Save as PDF</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opens accessible system print & PDF dialog</span>
            </div>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
