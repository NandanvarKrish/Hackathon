import React, { useState } from 'react';
import { 
  SmartNote, 
  LectureMedia,
  SummaryFocusMode,
  ExamCheatSheet
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
  Mic,
  GraduationCap,
  Zap,
  Lightbulb,
  FileText,
  AlertTriangle,
  Flame,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { generateTailoredSummary } from '../services/geminiService';
import { useAccessibility } from '../context/AccessibilityContext';

interface NotesViewProps {
  notes: SmartNote;
  media: LectureMedia[];
  onOpenPodcast: () => void;
  onOpenMindmap: () => void;
  onToggleActionItem: (id: string) => void;
  onContextMenuTrigger: (e: React.MouseEvent, sectionText: string, sectionId?: string) => void;
  onUpdateNotes?: (updated: SmartNote) => void;
  isRecording?: boolean;
}

const NotesViewComponent: React.FC<NotesViewProps> = ({
  notes,
  media,
  onOpenPodcast,
  onOpenMindmap,
  onToggleActionItem,
  onContextMenuTrigger,
  onUpdateNotes,
  isRecording = false
}) => {
  const { announce } = useAccessibility();
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState<SummaryFocusMode>('standard');
  const [isTldrMode, setIsTldrMode] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Switch Summary Focus & Trigger AI Generation if needed
  const handleSelectFocusMode = async (mode: SummaryFocusMode) => {
    setFocusMode(mode);
    announce(`Switched to ${mode} summary view`);

    if (mode === 'exam_cheatsheet' && !notes.examCheatSheet) {
      setIsGeneratingSummary(true);
      try {
        const res = await generateTailoredSummary(notes, 'exam_cheatsheet');
        const updated: SmartNote = {
          ...notes,
          examCheatSheet: res.cheatSheet,
          summaryFocusMode: 'exam_cheatsheet'
        };
        onUpdateNotes?.(updated);
        announce("Exam Cheat Sheet generated successfully!");
      } catch (e) {
        console.error(e);
      } finally {
        setIsGeneratingSummary(false);
      }
    }
  };

  const handleCopyMarkdown = React.useCallback(() => {
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
  }, [notes, announce]);

  const handlePrint = React.useCallback(() => {
    window.print();
    announce("Opening print dialog for accessible PDF export");
  }, [announce]);

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

      {/* Lecture Summary Focus Mode & View Mode Selector Bar */}
      <div className="card" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.85rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.4rem' }}>
            SUMMARY VIEW:
          </span>

          <button
            onClick={() => handleSelectFocusMode('standard')}
            className={`btn ${focusMode === 'standard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          >
            <FileText size={14} />
            <span>Standard Overview</span>
          </button>

          <button
            onClick={() => handleSelectFocusMode('exam_cheatsheet')}
            className={`btn ${focusMode === 'exam_cheatsheet' ? 'btn-rose' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          >
            <GraduationCap size={14} color="#f43f5e" />
            <span>🎓 High-Yield Exam Cheat Sheet</span>
          </button>

          <button
            onClick={() => handleSelectFocusMode('intuitive')}
            className={`btn ${focusMode === 'intuitive' ? 'btn-emerald' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          >
            <Lightbulb size={14} color="#10b981" />
            <span>💡 Intuitive Analogy (ELI5)</span>
          </button>

          <button
            onClick={() => handleSelectFocusMode('technical')}
            className={`btn ${focusMode === 'technical' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          >
            <Zap size={14} color="#38bdf8" />
            <span>⚡ Math & Formulas</span>
          </button>
        </div>

        {/* TL;DR Compact Toggle */}
        <button
          onClick={() => setIsTldrMode(prev => !prev)}
          className={`btn ${isTldrMode ? 'btn-rose' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
          title="Toggle 30-Second Compact Bullet Summary"
        >
          {isTldrMode ? <ToggleRight size={16} color="#ffffff" /> : <ToggleLeft size={16} />}
          <span>{isTldrMode ? '⚡ TL;DR 30-Sec View Active' : 'Detailed Notes View'}</span>
        </button>
      </div>

      {/* 🎓 HIGH-YIELD EXAM CHEAT SHEET VIEW */}
      {focusMode === 'exam_cheatsheet' && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08), rgba(15, 23, 42, 0.95))', border: '1px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <GraduationCap size={24} color="var(--accent-rose-light)" />
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                High-Yield Exam Cram Sheet: {notes.title}
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Curated formulas, definitions, and trap warnings for maximum test score retention.
              </p>
            </div>
          </div>

          {isGeneratingSummary ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-rose-light)' }}>
              <Sparkles size={28} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.5rem' }} />
              <p>Generating High-Yield Exam Formulas & Definition Table with AI...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* High Yield Formula Grid */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan-light)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Zap size={16} />
                  <span>Key Equations & Formulas:</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {(notes.examCheatSheet?.highYieldFormulas || [
                    { name: 'Conservation Principle', formula: '\\Delta E = W + Q', explanation: 'Total energy remains constant in an isolated system.' },
                    { name: 'Rate Constant', formula: 'k = A e^{-E_a / RT}', explanation: 'Arrhenius equation linking temperature to reaction velocity.' }
                  ]).map((item, idx) => (
                    <div key={idx} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.name}</strong>
                      <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', margin: '0.4rem 0', fontFamily: 'monospace', color: 'var(--accent-cyan-light)', fontWeight: 700, fontSize: '0.95rem' }}>
                        {item.formula}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Definition Table */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Flame size={16} />
                  <span>Must-Know Definition Table:</span>
                </h3>
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-medium)' }}>
                        <th style={{ padding: '0.65rem 1rem' }}>Term</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Definition</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Exam Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(notes.examCheatSheet?.definitionTable || notes.keyTerms.map(kt => ({ term: kt.term, definition: kt.definition, examImportance: 'Critical' as const }))).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'transparent' }}>
                          <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{row.term}</td>
                          <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>{row.definition}</td>
                          <td style={{ padding: '0.65rem 1rem' }}>
                            <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>{row.examImportance || 'Critical'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam Traps Warnings */}
              <div style={{ padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #f59e0b', color: '#fbbf24' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                  <AlertTriangle size={16} />
                  <span>Common Exam Traps & Mistakes to Avoid:</span>
                </strong>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {(notes.examCheatSheet?.examTraps || [
                    "Don't confuse initial boundary conditions with steady-state values.",
                    "Always check unit dimensions before calculating numerical answers."
                  ]).map((trap, idx) => (
                    <li key={idx}>{trap}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
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
            {focusMode === 'intuitive' ? '💡 Intuitive Analogy & Everyday Picture' :
             focusMode === 'technical' ? '⚡ Mathematical & Technical Formulation' :
             'Executive Summary & Central Thesis'}
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
          {focusMode === 'intuitive'
            ? `Think of ${notes.title} like an everyday machine: ${notes.executiveSummary}`
            : focusMode === 'technical'
            ? `Formal Definition of ${notes.title}: ${notes.executiveSummary}`
            : notes.executiveSummary}
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

export const NotesView = React.memo(NotesViewComponent);
