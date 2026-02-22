
export enum View {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT'
}

export enum QuestionStatus {
  UNVISITED = 'UNVISITED',
  NOT_ANSWERED = 'NOT_ANSWERED',
  ANSWERED = 'ANSWERED',
  MARKED_FOR_REVIEW = 'MARKED_FOR_REVIEW'
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number; // 0-3
  caseId?: number;
  topic?: string;
}

export interface CaseStudy {
  id: number;
  narrative: string;
  questionIds: number[];
}

export interface User {
  id: string;
  name: string;
  student_id: string;
  email: string;
  dob: string;
  class: string;
  stream?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'PREFER_NOT_SAY';
  is_verified?: boolean;
}

export interface QuizResult {
  score: number;
  total: number;
  paperId: string; // Changed to string to handle 'P1', 'P2', 'Mock'
  subject: string;
  answers: (number | null)[];
  timestamp: number;
  timeSpent: number; // in seconds
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  paper_id: string;
  subject: string;
  created_at: string;
}
