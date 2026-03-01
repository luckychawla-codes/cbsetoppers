
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
  class: 'IX' | 'X' | 'XI' | 'XII' | 'XII+';
  stream?: 'PCB' | 'PCM' | 'PCBM';
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'PREFER_NOT_SAY';
  is_verified?: boolean;
  competitive_exams?: string[];
  is_operator?: boolean;
}

export interface QuizResult {
  score: number;
  total: number;
  paperId: string;
  subject: string;
  answers: (number | null)[];
  timestamp: number;
  timeSpent: number; // in seconds
}

export type SubjectCategory = 'Core' | 'Additional';
export type MaterialType = 'pdf' | 'image' | 'video';

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  target_class: string;
  target_stream?: string;
  target_classes?: string[];
  target_streams?: string[];
  target_exams?: string[];
  created_at: string;
}

export interface Folder {
  id: string;
  subject_id: string;
  parent_id?: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface Material {
  id: string;
  folder_id?: string | null;
  subject_id: string;
  title: string;
  type: MaterialType;
  url: string;
  order_index: number;
  created_at: string;
}

// Keep for legacy support during transition if needed
export interface DashboardContent {
  id: string;
  title: string;
  type: string;
  content_link?: string;
  parent_id?: string;
  order_index: number;
  class_target?: string;
  stream_target?: string;
  exam_target?: string;
  created_at?: string;
}
