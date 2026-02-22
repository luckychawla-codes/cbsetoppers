
import { Question, CaseStudy } from './types';

export const TOPICS = {
  FIXTURES: "Tournament & Fixtures",
  DEFORMITIES: "Postural Deformities",
  YOGA: "Yoga & Lifestyle",
  CWSN: "Special Needs (CWSN)",
  NUTRITION: "Nutrition & Food Myths",
  MEASUREMENT: "Test & Measurement",
  PHYSIOLOGY: "Physiology & Injuries",
  BIOMECHANICS: "Biomechanics & Projectiles",
  PSYCHOLOGY: "Psychology in Sports",
  TRAINING: "Sports Training"
};

export const STREAM_SUBJECTS: Record<string, string[]> = {
  "PCM": ["Physics", "Chemistry", "Mathematics", "English Core"],
  "PCB": ["Physics", "Chemistry", "Biology", "English Core"],
  "Commerce": ["Accountancy", "Economics", "Business Studies", "English Core"],
  "Humanities": ["History", "Political Science", "Geography", "Economics", "English Core"],
  "X": ["Mathematics", "Science", "Social Science", "English"],
};

export const CASE_STUDIES_P1: CaseStudy[] = [];
export const CASE_STUDIES_P2: CaseStudy[] = [];
export const PAPER_1_QUESTIONS: Question[] = [];
export const PAPER_2_QUESTIONS: Question[] = [];

