import React, { useState } from 'react';
import { Key, ShieldCheck, X, Sparkles, ExternalLink, Server } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
      onSaved();
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div 
        role="dialog"
        aria-labelledby="api-modal-title"
        className="card"
        style={{
          maxWidth: '540px',
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
          aria-label="Close API Key modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} color="var(--accent-cyan-light)" />
          </div>
          <div>
            <h2 id="api-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Gemini API Key Setup
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Powers real-time vision OCR, smart note generation, and podcast synthesis.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label 
            htmlFor="gemini-key-input" 
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}
          >
            Google AI Studio API Key (Development Mode):
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="gemini-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem'
              }}
            />
            <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}>
          <Server size={18} color="var(--accent-cyan-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span><strong>Production Security Notice:</strong> In production deployments, client-side keys are proxied via secure serverless functions (`VITE_GEMINI_API_KEY`). Local keys entered here are stored strictly in your browser's LocalStorage.</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.825rem',
              color: 'var(--accent-cyan-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none'
            }}
          >
            <span>Get a free Gemini key</span>
            <ExternalLink size={13} />
          </a>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              {showSavedMsg ? 'Saved! ✓' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
