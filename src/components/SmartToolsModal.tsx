import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Smile, 
  Layers, 
  HelpCircle, 
  GitFork, 
  Volume2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  RotateCw, 
  Check, 
  Copy,
  Send,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveModalType, Flashcard, MindmapData, MindmapNode, QuizQuestion, SmartToolResult } from '../types/notes';
import { speechService } from '../services/speechService';
import { useAccessibility } from '../context/AccessibilityContext';

interface SmartToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SmartToolResult | null;
  onAskAiSubmit?: (question: string) => Promise<string>;
}

export const SmartToolsModal: React.FC<SmartToolsModalProps> = ({
  isOpen,
  onClose,
  result,
  onAskAiSubmit
}) => {
  const { announce } = useAccessibility();
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Ask AI state
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiChatResponse, setAiChatResponse] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  // Flashcards navigation
  const flashcards = result.flashcards || [];
  const currentCard = flashcards[currentFlashcardIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(prev => prev + 1);
    } else {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      announce("Congratulations! Completed all flashcards in this deck.");
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentFlashcardIndex(prev => Math.max(0, prev - 1));
  };

  const toggleMastered = (cardId: string) => {
    setMasteredCards(prev => {
      const next = { ...prev, [cardId]: !prev[cardId] };
      announce(next[cardId] ? "Card marked as mastered" : "Card marked for review");
      return next;
    });
  };

  // Quiz evaluation
  const quiz = result.quiz || [];
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    setSubmittedQuiz(true);
    let correctCount = 0;
    quiz.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) correctCount++;
    });
    if (correctCount === quiz.length) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
    announce(`Quiz finished! Score: ${correctCount} of ${quiz.length} correct.`);
  };

  // Handle Ask AI submit
  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || !onAskAiSubmit) return;
    setIsChatLoading(true);
    announce("AI is generating explanation...");
    try {
      const res = await onAskAiSubmit(customQuestion);
      setAiChatResponse(res);
      setIsChatLoading(false);
      announce("Answer ready.");
    } catch {
      setIsChatLoading(false);
    }
  };

  const handleReadAloud = (text: string) => {
    speechService.speakText(text, { speaker: 'Alex' });
    announce("Reading text aloud");
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
      zIndex: 110,
      padding: '1.5rem'
    }}>
      <div 
        role="dialog"
        aria-labelledby="smart-tool-title"
        className="card"
        style={{
          maxWidth: '740px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => { speechService.stopSpeaking(); onClose(); }}
          className="btn btn-secondary btn-icon"
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: result.type === 'quiz' ? 'rgba(167, 139, 250, 0.15)' : result.type === 'flashcards' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {result.type === 'summary' && <Sparkles size={20} color="var(--accent-cyan-light)" />}
            {result.type === 'eli5' && <Smile size={20} color="var(--accent-amber-light)" />}
            {result.type === 'flashcards' && <Layers size={20} color="var(--accent-emerald-light)" />}
            {result.type === 'quiz' && <HelpCircle size={20} color="var(--accent-purple-light)" />}
            {result.type === 'mindmap' && <GitFork size={20} color="var(--accent-rose-light)" />}
            {result.type === 'askAi' && <MessageSquare size={20} color="var(--accent-cyan-light)" />}
          </div>
          <div>
            <h2 id="smart-tool-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {result.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              EchoNote AI Instant Smart Tool
            </span>
          </div>
        </div>

        {/* 1. SMART SUMMARY VIEW */}
        {result.type === 'summary' && result.summaryPoints && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              ⚡ 3-Bullet Accelerated Concept Summary:
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.summaryPoints.map((point, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    borderLeft: '4px solid var(--accent-cyan-light)',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6'
                  }}
                >
                  {point}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => handleReadAloud(result.summaryPoints!.join('. '))}
                className="btn btn-secondary"
              >
                <Volume2 size={16} />
                <span>Read Aloud</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. ELI5 (EXPLAIN LIKE I'M 5) VIEW */}
        {result.type === 'eli5' && result.eli5Text && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.8))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '1.05rem',
              lineHeight: '1.8',
              color: 'var(--text-primary)'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🎈</span>
              {result.eli5Text}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => handleReadAloud(result.eli5Text!)}
                className="btn btn-emerald"
              >
                <Volume2 size={16} />
                <span>Listen to ELI5 Explanation</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. 3D FLIP FLASHCARDS VIEW */}
        {result.type === 'flashcards' && flashcards.length > 0 && currentCard && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="badge badge-emerald">
                Card {currentFlashcardIndex + 1} of {flashcards.length}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentCard.category}
              </span>
            </div>

            {/* Flip Card Container */}
            <div 
              className="flip-card-container" 
              onClick={() => setIsFlipped(prev => !prev)}
              role="button"
              tabIndex={0}
              aria-label={`Flashcard: ${isFlipped ? currentCard.back : currentCard.front}. Press space or click to flip.`}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setIsFlipped(prev => !prev); }}
            >
              <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* Front Side */}
                <div className="flip-card-front">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan-light)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Question / Concept (Click to flip)
                  </span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {currentCard.front}
                  </p>
                  <span style={{ position: 'absolute', bottom: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RotateCw size={13} /> Click or spacebar to reveal answer
                  </span>
                </div>

                {/* Back Side */}
                <div className="flip-card-back">
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-emerald-light)', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Answer & Takeaway
                  </span>
                  <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                    {currentCard.back}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReadAloud(currentCard.back); }}
                    className="btn btn-secondary btn-icon"
                    style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
                    title="Read answer aloud"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Flashcard Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <button
                onClick={handlePrevCard}
                disabled={currentFlashcardIndex === 0}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>

              <button
                onClick={() => toggleMastered(currentCard.id)}
                className={`btn ${masteredCards[currentCard.id] ? 'btn-emerald' : 'btn-secondary'}`}
              >
                <CheckCircle2 size={16} />
                <span>{masteredCards[currentCard.id] ? 'Mastered ✓' : 'Mark as Mastered'}</span>
              </button>

              <button
                onClick={handleNextCard}
                className="btn btn-primary"
              >
                <span>{currentFlashcardIndex === flashcards.length - 1 ? 'Finish Deck' : 'Next Card'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 4. PRACTICE QUIZ VIEW */}
        {result.type === 'quiz' && quiz.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {quiz.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = isAnswered && selectedOpt === q.correctIndex;

              return (
                <div key={q.id || qIdx} style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                    {qIdx + 1}. {q.question}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options.map((opt, oIdx) => {
                      let btnBg = 'rgba(15, 23, 42, 0.7)';
                      let btnBorder = 'var(--border-subtle)';
                      let btnColor = 'var(--text-secondary)';

                      if (submittedQuiz) {
                        if (oIdx === q.correctIndex) {
                          btnBg = 'rgba(16, 185, 129, 0.2)';
                          btnBorder = 'var(--accent-emerald)';
                          btnColor = 'var(--accent-emerald-light)';
                        } else if (selectedOpt === oIdx) {
                          btnBg = 'rgba(225, 29, 72, 0.2)';
                          btnBorder = 'var(--accent-rose)';
                          btnColor = 'var(--accent-rose-light)';
                        }
                      } else if (selectedOpt === oIdx) {
                        btnBg = 'rgba(56, 189, 248, 0.2)';
                        btnBorder = 'var(--accent-cyan-light)';
                        btnColor = 'var(--text-primary)';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: btnBg,
                            border: `1px solid ${btnBorder}`,
                            color: btnColor,
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: selectedOpt === oIdx ? 600 : 400,
                            cursor: submittedQuiz ? 'default' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontWeight: 700, marginRight: '0.5rem' }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {submittedQuiz && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(225, 29, 72, 0.1)',
                      border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
                      fontSize: '0.825rem',
                      color: isCorrect ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)'
                    }}>
                      <strong>{isCorrect ? 'Correct! ✓ ' : 'Incorrect. '}</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {!submittedQuiz ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length < quiz.length}
                className="btn btn-emerald"
                style={{ padding: '0.85rem' }}
              >
                <span>Submit & Check Score</span>
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Score: {quiz.filter(q => selectedAnswers[q.id] === q.correctIndex).length} / {quiz.length}
                </span>
                <button
                  onClick={() => { setSelectedAnswers({}); setSubmittedQuiz(false); }}
                  className="btn btn-secondary"
                >
                  <RotateCw size={15} />
                  <span>Retry Quiz</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. CONCEPT MINDMAP VIEWER */}
        {result.type === 'mindmap' && result.mindmap && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              overflowX: 'auto'
            }}>
              {/* Root node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                  textAlign: 'center'
                }}>
                  {result.mindmap.root.label}
                </div>

                {/* Branches */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', width: '100%' }}>
                  {result.mindmap.root.children?.map((branch, bIdx) => (
                    <div
                      key={branch.id || bIdx}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <strong style={{ color: 'var(--accent-cyan-light)', fontSize: '0.95rem' }}>
                        {branch.label}
                      </strong>
                      {branch.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {branch.description}
                        </p>
                      )}
                      {branch.children && (
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                          {branch.children.map((leaf, lIdx) => (
                            <li
                              key={leaf.id || lIdx}
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(15, 23, 42, 0.7)',
                                fontSize: '0.825rem',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              • {leaf.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ASK AI CUSTOM QUESTION VIEW */}
        {result.type === 'askAi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <form onSubmit={handleCustomQuestionSubmit} style={{ display: 'flex', gap: '0.65rem' }}>
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ask anything about this selection..."
                autoFocus
                disabled={isChatLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="submit"
                disabled={isChatLoading || !customQuestion.trim()}
                className="btn btn-primary"
              >
                {isChatLoading ? <Sparkles size={16} /> : <Send size={16} />}
                <span>{isChatLoading ? 'Thinking...' : 'Ask AI'}</span>
              </button>
            </form>

            {aiChatResponse && (
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: 'var(--text-primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--accent-cyan-light)' }}>AI Response:</strong>
                  <button
                    onClick={() => handleReadAloud(aiChatResponse)}
                    className="btn btn-secondary btn-icon"
                    style={{ padding: '0.3rem 0.5rem' }}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
                <p>{aiChatResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
