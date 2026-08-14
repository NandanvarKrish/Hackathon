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
}

export interface TranscriptSegment {
  id: string;
  timestamp: number; // in seconds
  speaker: string;
  text: string;
}

export type SummaryFocusMode = 'standard' | 'exam_cheatsheet' | 'intuitive' | 'technical';

export interface ExamCheatSheet {
  highYieldFormulas: { name: string; formula: string; explanation: string }[];
  definitionTable: { term: string; definition: string; examImportance: 'High' | 'Medium' | 'Critical' }[];
  examTraps: string[];
  quickFacts: string[];
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
  examCheatSheet?: ExamCheatSheet;
  summaryFocusMode?: SummaryFocusMode;
  intuitiveSummary?: string;
  technicalSummary?: string;
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

export type PodcastFormat = 'dual_host' | 'storyteller' | 'speed_run' | 'socratic';

export interface PodcastChapter {
  id: string;
  title: string;
  lineIndex: number;
  timestampOffset: number;
}

export interface PodcastScript {
  id: string;
  title: string;
  format: PodcastFormat;
  description: string;
  chapters?: PodcastChapter[];
  dialogue: PodcastLine[];
}

export interface PodcastLine {
  id: string;
  speaker: 'Alex' | 'Jordan' | 'David' | 'Socrates' | 'Maya' | 'User';
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
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
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
  | 'askAi';

export interface SmartToolResult {
  type: ActiveModalType;
  title: string;
  content?: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  mindmap?: MindmapData;
  eli5Text?: string;
  summaryPoints?: string[];
}
