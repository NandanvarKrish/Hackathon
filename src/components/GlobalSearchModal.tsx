import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Layers, Camera, FileText, ArrowRight } from 'lucide-react';
import { globalSearch } from '../services/storageService';
import { GlobalSearchResult } from '../types/notes';
import { useAccessibility } from '../context/AccessibilityContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: GlobalSearchResult) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const { announce } = useAccessibility();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchRes = globalSearch(query);
      setResults(searchRes);
      announce(`Found ${searchRes.length} search matches for "${query}"`);
    } else {
      setResults([]);
    }
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '6vh',
      zIndex: 150
    }}>
      <div 
        role="dialog"
        aria-labelledby="search-modal-title"
        className="card"
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          padding: '0'
        }}
      >
        {/* Search Header Input */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <Search size={22} color="var(--accent-cyan-light)" />
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all lectures, transcripts, terms, slides, flashcards..."
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              outline: 'none'
            }}
          />
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            aria-label="Close search modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {!query.trim() ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                Type a keyword like <em>"qubit"</em>, <em>"Hadamard"</em>, or <em>"gradient"</em> to search.
              </p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Searches transcripts, executive summaries, glossary terms, slides OCR, and flashcards.
              </span>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              No matches found for <strong>"{query}"</strong>.
            </div>
          ) : (
            results.map((res, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectResult(res);
                  onClose();
                  announce(`Navigating to ${res.title}`);
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${res.type === 'slide' ? 'badge-emerald' : res.type === 'term' ? 'badge-rose' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
                      {res.type}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      in <strong>{res.lectureTitle}</strong>
                    </span>
                  </div>

                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {res.title}
                  </strong>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {res.snippet}
                  </p>
                </div>

                <ArrowRight size={18} color="var(--accent-cyan-light)" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
