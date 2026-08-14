import { 
  LectureSession, 
  UserAnalytics, 
  GlobalSearchResult, 
  QuizAttempt,
  ExportFormatType
} from '../types/notes';
import { INITIAL_LECTURE } from './mockData';

const LECTURES_STORAGE_KEY = 'echonote_lectures_db';
const MASTERED_FLASHCARDS_KEY = 'echonote_mastered_flashcards';
const QUIZ_ATTEMPTS_KEY = 'echonote_quiz_attempts';
const ACTIVE_LECTURE_ID_KEY = 'echonote_active_lecture_id';

/**
 * Initialize storage with default sample lecture if storage is empty
 */
export function getAllLectures(): LectureSession[] {
  try {
    const raw = localStorage.getItem(LECTURES_STORAGE_KEY);
    if (!raw) {
      const initialList = [INITIAL_LECTURE];
      localStorage.setItem(LECTURES_STORAGE_KEY, JSON.stringify(initialList));
      return initialList;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [INITIAL_LECTURE];
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load lectures from storage:', err);
    return [INITIAL_LECTURE];
  }
}

export function getLectureById(id: string): LectureSession | undefined {
  const lectures = getAllLectures();
  return lectures.find(l => l.id === id);
}

export function saveLecture(lecture: LectureSession): void {
  try {
    const lectures = getAllLectures();
    const index = lectures.findIndex(l => l.id === lecture.id);
    const updatedLecture = {
      ...lecture,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      lectures[index] = updatedLecture;
    } else {
      lectures.unshift({
        ...updatedLecture,
        createdAt: updatedLecture.createdAt || new Date().toISOString()
      });
    }

    localStorage.setItem(LECTURES_STORAGE_KEY, JSON.stringify(lectures));
    localStorage.setItem(ACTIVE_LECTURE_ID_KEY, lecture.id);
  } catch (err) {
    console.error('Failed to save lecture to storage:', err);
  }
}

export function deleteLecture(id: string): void {
  try {
    const lectures = getAllLectures().filter(l => l.id !== id);
    localStorage.setItem(LECTURES_STORAGE_KEY, JSON.stringify(lectures));
  } catch (err) {
    console.error('Failed to delete lecture:', err);
  }
}

export function getActiveLectureId(): string {
  return localStorage.getItem(ACTIVE_LECTURE_ID_KEY) || INITIAL_LECTURE.id;
}

export function setActiveLectureId(id: string): void {
  localStorage.setItem(ACTIVE_LECTURE_ID_KEY, id);
}

// ── Mastered Flashcards Tracking ──────────────────────────────────────────

export function getMasteredFlashcardIds(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(MASTERED_FLASHCARDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setFlashcardMastered(cardId: string, mastered: boolean): void {
  try {
    const current = getMasteredFlashcardIds();
    if (mastered) {
      current[cardId] = true;
    } else {
      delete current[cardId];
    }
    localStorage.setItem(MASTERED_FLASHCARDS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save flashcard mastery:', err);
  }
}

// ── Quiz Attempt Scores Tracking ──────────────────────────────────────────

export function getQuizAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(QUIZ_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuizAttempt(attempt: QuizAttempt): void {
  try {
    const attempts = getQuizAttempts();
    attempts.unshift(attempt);
    localStorage.setItem(QUIZ_ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save quiz attempt:', err);
  }
}

// ── User Analytics Calculation ────────────────────────────────────────────

export function getUserAnalytics(): UserAnalytics {
  const lectures = getAllLectures();
  const masteredMap = getMasteredFlashcardIds();
  const attempts = getQuizAttempts();

  const totalLectures = lectures.length;
  const totalStudyTimeSeconds = lectures.reduce((acc, l) => acc + (l.duration || 0), 0);
  const flashcardsMasteredCount = Object.keys(masteredMap).length;

  let totalScorePercentSum = 0;
  attempts.forEach(a => {
    if (a.totalQuestions > 0) {
      totalScorePercentSum += (a.score / a.totalQuestions) * 100;
    }
  });
  const quizAveragePercent = attempts.length > 0 ? Math.round(totalScorePercentSum / attempts.length) : 85;

  let conceptsLearnedCount = 0;
  let completedActionItemsCount = 0;

  lectures.forEach(l => {
    if (l.notes) {
      conceptsLearnedCount += (l.notes.keyTerms?.length || 0) + (l.notes.sections?.length || 0);
      completedActionItemsCount += l.notes.actionItems?.filter(a => a.completed).length || 0;
    }
  });

  return {
    totalLectures,
    totalStudyTimeSeconds,
    flashcardsMasteredCount,
    quizAveragePercent,
    conceptsLearnedCount,
    completedActionItemsCount
  };
}

// ── Global Search Engine ──────────────────────────────────────────────────

export function globalSearch(query: string): GlobalSearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const lectures = getAllLectures();
  const results: GlobalSearchResult[] = [];

  lectures.forEach(l => {
    // Search transcript segments
    l.transcript?.forEach(seg => {
      if (seg.text.toLowerCase().includes(q)) {
        results.push({
          lectureId: l.id,
          lectureTitle: l.title,
          subject: l.subject,
          type: 'transcript',
          title: `Transcript @ ${Math.floor(seg.timestamp / 60)}:${(seg.timestamp % 60).toString().padStart(2, '0')}`,
          snippet: seg.text,
          timestamp: seg.timestamp
        });
      }
    });

    // Search note sections
    l.notes?.sections?.forEach(sec => {
      if (sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)) {
        results.push({
          lectureId: l.id,
          lectureTitle: l.title,
          subject: l.subject,
          type: 'note',
          title: sec.title,
          snippet: sec.content.slice(0, 150) + '...',
          timestamp: sec.timestamp
        });
      }
    });

    // Search key terms
    l.notes?.keyTerms?.forEach(term => {
      if (term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q)) {
        results.push({
          lectureId: l.id,
          lectureTitle: l.title,
          subject: l.subject,
          type: 'term',
          title: `Key Term: ${term.term}`,
          snippet: term.definition
        });
      }
    });

    // Search slide media OCR
    l.media?.forEach(m => {
      if (m.title.toLowerCase().includes(q) || m.ocrText.toLowerCase().includes(q) || m.aiExplanation.toLowerCase().includes(q)) {
        results.push({
          lectureId: l.id,
          lectureTitle: l.title,
          subject: l.subject,
          type: 'slide',
          title: m.title,
          snippet: m.ocrText.slice(0, 120) + '...',
          timestamp: m.timestamp
        });
      }
    });

    // Search flashcards
    l.notes?.flashcards?.forEach(fc => {
      if (fc.front.toLowerCase().includes(q) || fc.back.toLowerCase().includes(q)) {
        results.push({
          lectureId: l.id,
          lectureTitle: l.title,
          subject: l.subject,
          type: 'flashcard',
          title: `Flashcard: ${fc.front}`,
          snippet: fc.back
        });
      }
    });
  });

  return results.slice(0, 30);
}

// ── Export Generators ─────────────────────────────────────────────────────

export function exportLectureData(lecture: LectureSession, format: ExportFormatType): { filename: string; content: string; mimeType: string } {
  const safeTitle = (lecture.title || 'lecture').replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'txt') {
    let content = `===================================================\n`;
    content += `${lecture.title} (${lecture.subject})\n`;
    content += `Date: ${lecture.date} | Duration: ${Math.floor(lecture.duration / 60)}m ${lecture.duration % 60}s\n`;
    content += `===================================================\n\n`;

    content += `--- EXECUTIVE SUMMARY ---\n${lecture.notes?.executiveSummary || 'No summary available.'}\n\n`;

    content += `--- KEY TAKEAWAYS ---\n`;
    lecture.notes?.keyTakeaways.forEach((t, i) => { content += `${i + 1}. ${t}\n`; });

    content += `\n--- TRANSCRIPT ---\n`;
    lecture.transcript.forEach(seg => {
      content += `[${Math.floor(seg.timestamp / 60)}:${(seg.timestamp % 60).toString().padStart(2, '0')}] ${seg.speaker}: ${seg.text}\n`;
    });

    return {
      filename: `${safeTitle}_transcript.txt`,
      content,
      mimeType: 'text/plain;charset=utf-8'
    };
  }

  if (format === 'csv') {
    let content = `"Front Question","Back Answer","Category"\n`;
    lecture.notes?.flashcards?.forEach(fc => {
      content += `"${fc.front.replace(/"/g, '""')}","${fc.back.replace(/"/g, '""')}","${fc.category.replace(/"/g, '""')}"\n`;
    });
    return {
      filename: `${safeTitle}_flashcards.csv`,
      content,
      mimeType: 'text/csv;charset=utf-8'
    };
  }

  if (format === 'json') {
    return {
      filename: `${safeTitle}_data.json`,
      content: JSON.stringify(lecture, null, 2),
      mimeType: 'application/json;charset=utf-8'
    };
  }

  // Markdown (Default)
  let md = `# ${lecture.title}\n\n`;
  md += `**Subject:** ${lecture.subject} | **Date:** ${lecture.date} | **Duration:** ${Math.floor(lecture.duration / 60)} min\n\n`;
  md += `## Executive Summary\n${lecture.notes?.executiveSummary || ''}\n\n`;

  if (lecture.notes?.keyTakeaways?.length) {
    md += `## Key Takeaways\n`;
    lecture.notes.keyTakeaways.forEach(t => { md += `- ${t}\n`; });
    md += `\n`;
  }

  if (lecture.notes?.sections?.length) {
    md += `## Lecture Sections\n\n`;
    lecture.notes.sections.forEach(s => {
      md += `### ${s.title}\n*Timestamp: ${Math.floor(s.timestamp / 60)}:${(s.timestamp % 60).toString().padStart(2, '0')}*\n\n${s.content}\n\n`;
      if (s.bulletPoints?.length) {
        s.bulletPoints.forEach(b => { md += `- ${b}\n`; });
        md += `\n`;
      }
      if (s.keyFormula) {
        md += `**Key Formula:** \`${s.keyFormula}\`\n\n`;
      }
    });
  }

  if (lecture.notes?.keyTerms?.length) {
    md += `## Key Glossary Terms\n`;
    lecture.notes.keyTerms.forEach(kt => {
      md += `- **${kt.term}**: ${kt.definition}\n`;
    });
    md += `\n`;
  }

  if (lecture.notes?.actionItems?.length) {
    md += `## Action Items & Revision\n`;
    lecture.notes.actionItems.forEach(ai => {
      md += `- [${ai.completed ? 'x' : ' '}] ${ai.text}\n`;
    });
  }

  return {
    filename: `${safeTitle}_notes.md`,
    content: md,
    mimeType: 'text/markdown;charset=utf-8'
  };
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
