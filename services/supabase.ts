
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hkdkhzfdmvcxvopasohm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZGtoemZkbXZjeHZvcGFzb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDU2NzgsImV4cCI6MjA4Njg4MTY3OH0.7It-Dx1QyTyaIFRgsIb46y6IoHOl13RFGaUvXBwkKPI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SaveResultParams {
  student_id: string;
  name: string;
  score: number;
  paper_id: string;
  subject: string;
  answers: (number | null)[];
}

export const saveResult = async (params: SaveResultParams) => {
  try {
    const payload = {
      student_id: String(params.student_id),
      name: String(params.name),
      score: Math.floor(params.score),
      paper_id: params.paper_id,
      subject: params.subject,
      answers: params.answers
    };

    const { data, error } = await supabase
      .from('pe_results')
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error saving result:', err);
    throw err;
  }
};

export const registerStudent = async (params: {
  name: string;
  dob: string;
  studentClass: string;
  stream?: string;
  email: string;
  phone?: string;
  password?: string;
  rollNumber: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{
        name: params.name.trim(),
        dob: params.dob,
        class: params.studentClass,
        stream: params.stream || null,
        email: params.email.trim(),
        phone: params.phone?.trim() || null,
        password: params.password, // Security note: Ideally this should be hashed if using standard auth
        student_id: params.rollNumber.trim()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    if ((err as any).code === '23505') {
      throw new Error('This email or Student ID is already registered.');
    }
    console.error('Registration error:', err);
    throw err;
  }
};

export const fetchUserAttemptCount = async (studentId: string, subject: string, paperId: string) => {
  try {
    const { count, error } = await supabase
      .from('pe_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', String(studentId))
      .eq('subject', subject)
      .eq('paper_id', paperId);

    if (error) throw error;
    return count || 0;
  } catch (err) { return 0; }
};

export const fetchUserResults = async (studentId: string, subject: string, paperId: string) => {
  try {
    const { data, error } = await supabase
      .from('pe_results')
      .select('*')
      .eq('student_id', String(studentId))
      .eq('subject', subject)
      .eq('paper_id', paperId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) { return []; }
};

export const fetchLeaderboard = async (subject: string, paperId: string) => {
  try {
    const { data, error } = await supabase
      .from('pe_results')
      .select('student_id, name, score, paper_id, subject, created_at')
      .eq('subject', subject)
      .eq('paper_id', paperId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const latestPerStudent = new Map();
    data.forEach(item => {
      if (!latestPerStudent.has(item.student_id)) { latestPerStudent.set(item.student_id, item); }
    });

    return Array.from(latestPerStudent.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  } catch (err) { return []; }
};

export const verifyStudent = async (identifier: string, password?: string) => {
  try {
    const query = supabase
      .from('students')
      .select('id, name, student_id, email, password, dob, class, stream, phone, is_verified')
      .or(`student_id.eq.${identifier.trim()},email.eq.${identifier.trim()}`);

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Direct password match (Note: In a real app, use bcrypt/argon2 hashing)
    if (data.password && data.password !== password) {
      throw new Error('Incorrect password');
    }

    if (data.is_verified === false) {
      throw new Error('Verification required. Please confirm your email.');
    }

    return data;
  } catch (err) {
    if ((err as any).message === 'Incorrect password') throw err;
    return null;
  }
};
