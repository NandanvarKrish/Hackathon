export interface LectureSession {
  id: string;
  title: string;
  subject: string;
  date: string;
  duration: number; // in seconds
  audioUrl?: string;
  transcript: TranscriptSegment[];
  rawTranscript: string;
  notes?: SmartNote;
  media: LectureMedia[];
  podcast?: PodcastScript;
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
}

export interface TranscriptSegment {
  id: string;
  timestamp: number; // in seconds
  speaker: string;
  text: string;
}

export interface SmartNote {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  sections: NoteSection[];
  keyTerms: { term: string; definition: string }[];
  actionItems: { id: string; text: string; completed: boolean }[];
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  mindmap?: MindmapData;
  examFocus?: string[];
}

export interface NoteSection {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  bulletPoints: string[];
  keyFormula?: string;
  codeSnippet?: string;
  mediaId?: string; // Links to a photo/slide taken at this time
}

export interface LectureMedia {
  id: string;
  timestamp: number;
  imageUrl: string;
  title: string;
  ocrText: string;
  aiExplanation: string;
  tags: string[];
}

export interface PodcastScript {
  id: string;
  title: string;
  format: 'dual_host' | 'storyteller';
  description: string;
  dialogue: PodcastLine[];
}

export interface PodcastLine {
  id: string;
  speaker: 'Alex' | 'Jordan' | 'David' | 'User';
  speakerRole: string;
  text: string;
  timestampOffset: number; // approximate seconds offset
  emotion?: 'excited' | 'curious' | 'thoughtful' | 'explaining' | 'answering';
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  lectureId: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
}

export interface MindmapNode {
  id: string;
  label: string;
  description?: string;
  children?: MindmapNode[];
}

export interface MindmapData {
  root: MindmapNode;
}

export interface StudyPlan {
  id: string;
  lectureTitle: string;
  summary: string;
  milestones: { title: string; targetMinutes: number; tasks: string[] }[];
}

export interface UserAnalytics {
  totalLectures: number;
  totalStudyTimeSeconds: number;
  flashcardsMasteredCount: number;
  quizAveragePercent: number;
  conceptsLearnedCount: number;
  completedActionItemsCount: number;
}

export interface GlobalSearchResult {
  lectureId: string;
  lectureTitle: string;
  subject: string;
  type: 'transcript' | 'note' | 'term' | 'slide' | 'flashcard';
  title: string;
  snippet: string;
  timestamp?: number;
}

export type ActiveViewType = 
  | 'dashboard'
  | 'live'
  | 'library'
  | 'timeline'
  | 'notes'
  | 'podcast'
  | 'media'
  | 'mindmap';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
  sourceSectionId?: string;
}

export type ActiveModalType = 
  | 'none'
  | 'summary'
  | 'eli5'
  | 'flashcards'
  | 'quiz'
  | 'mindmap'
  | 'camera'
  | 'apiKey'
  | 'askAi'
  | 'export'
  | 'search';

export interface SmartToolResult {
  type: ActiveModalType;
  title: string;
  content?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  mindmap?: MindmapData;
  eli5Text?: string;
  summaryPoints?: string[];
  isFallback?: boolean;
}

export type ExportFormatType = 'txt' | 'md' | 'csv' | 'json' | 'package';
