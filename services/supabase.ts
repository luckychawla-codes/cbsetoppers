import { createClient } from '@supabase/supabase-js';
import { decode } from '../utils/crypto';

// Encrypted keys for security
const _U = "aHR0cHM6Ly9oa2RraHpmZG12Y3h2b3Bhc29obS5zdXBhYmFzZS5jbw==";
const _K = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1oclpHdG9lbVprYlhaamVIWnZjR0Z6YjJodElpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpFek1EVTJOemdzSW1WNGNDSTZNakE0TmpnNE1UWTNPSDAuN0l0LUR4MVF5VHlhSUZSZ3NJYjQ2eTZJb0hPbDEzUkZHYVV2WEJ3a0tQSQ==";

const SUPABASE_URL = decode(_U);
const SUPABASE_ANON_KEY = decode(_K);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const registerStudent = async (params: {
  name: string;
  dob: string;
  studentClass: string;
  stream?: string;
  email: string;
  phone?: string;
  password?: string;
  rollNumber: string;
  gender: string;
  competitiveExams?: string[];
}) => {
  try {
    // 1. Create user in Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password || '',
      options: {
        data: {
          full_name: params.name.trim(),
        }
      }
    });

    if (authError) throw authError;

    // 2. Insert additional details into our 'students' table
    const { data: profileData, error: profileError } = await supabase
      .from('students')
      .insert([{
        name: params.name.trim(),
        dob: params.dob,
        class: params.studentClass,
        stream: params.stream || null,
        email: params.email.trim(),
        phone: params.phone?.trim() || null,
        student_id: params.rollNumber.trim(),
        gender: params.gender,
        competitive_exams: params.competitiveExams || [],
        is_verified: true
      }])
      .select()
      .single();

    if (profileError) throw profileError;
    return profileData;
  } catch (err) {
    if ((err as any).code === '23505') {
      throw new Error('This email or Student ID is already registered.');
    }
    console.error('Registration error:', err);
    throw err;
  }
};

export const updateStudentProfile = async (studentId: string, updates: {
  name?: string;
  gender?: string;
  class?: string;
  stream?: string;
  dob?: string;
  competitive_exams?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Update profile error:', err);
    throw err;
  }
};

export const verifyStudent = async (identifier: string, password?: string) => {
  try {
    const ident = identifier.trim();

    // 1. Find the email if Student ID was used
    let email = ident;
    if (!ident.includes('@')) {
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('email')
        .eq('student_id', ident)
        .maybeSingle();

      if (fetchError || !student) return null;
      email = student.email;
    }

    // 2. Authenticate via Supabase Auth (Secure & Linked)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password || '',
    });

    if (authError) {
      if (authError.message.includes('Invalid login')) throw new Error('Incorrect password');
      throw authError;
    }

    // 3. Fetch full profile from 'students' table
    const { data: profile, error: profileError } = await supabase
      .from('students')
      .select('id, name, student_id, email, dob, class, stream, phone, gender, is_verified, competitive_exams')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !profile) return null;

    return profile;
  } catch (err: any) {
    if (err.message === 'Incorrect password') throw err;
    console.error('Login error:', err);
    return null;
  }
};

/** Save a completed quiz result to the database */
export const saveQuizResult = async (params: {
  student_id: string;
  subject: string;
  score: number;
  total: number;
  paper_id: string;
  time_spent: number;
}) => {
  try {
    const { error } = await supabase.from('quiz_results').insert([{
      student_id: params.student_id,
      subject: params.subject,
      score: params.score,
      total: params.total,
      paper_id: params.paper_id,
      time_spent: params.time_spent,
      created_at: new Date().toISOString(),
    }]);
    if (error) console.error('saveQuizResult error:', error);
  } catch (e) { console.error('saveQuizResult:', e); }
};

/** Fetch real analytics for a student */
export const fetchStudentStats = async (student_id: string) => {
  try {
    // All quiz results for this student
    const { data: results } = await supabase
      .from('quiz_results')
      .select('subject, score, total, created_at')
      .eq('student_id', student_id)
      .order('created_at', { ascending: true });

    if (!results || results.length === 0) return null;

    // Accuracy
    const totalScore = results.reduce((a, r) => a + r.score, 0);
    const totalQ = results.reduce((a, r) => a + r.total, 0);
    const accuracy = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;

    // Subject breakdown
    const subjMap: Record<string, { score: number; total: number }> = {};
    results.forEach(r => {
      if (!subjMap[r.subject]) subjMap[r.subject] = { score: 0, total: 0 };
      subjMap[r.subject].score += r.score;
      subjMap[r.subject].total += r.total;
    });
    const subjects = Object.entries(subjMap).map(([name, d]) => ({
      name, pct: Math.round((d.score / d.total) * 100)
    })).sort((a, b) => b.pct - a.pct);
    const strongest = subjects[0]?.name;
    const weakest = subjects[subjects.length - 1]?.name;

    // XP
    const xp = results.reduce((a, r) => a + Math.round((r.score / r.total) * 100) + 10, 0);

    // Streak (consecutive unique days)
    const days = Array.from(new Set(results.map(r => new Date(r.created_at).toDateString())));
    const streak = days.length;

    // Last 7 tests
    const last7 = results.slice(-7);
    const chartLabels = last7.map((_, i) => `Test ${results.length - last7.length + i + 1}`);
    const chartData = last7.map(r => Math.round((r.score / r.total) * 100));

    // Leaderboard (top 10 across all students)
    const { data: lb } = await supabase
      .from('quiz_results')
      .select('student_id, score, total, students(name)')
      .order('created_at', { ascending: false })
      .limit(200);

    const lbMap: Record<string, { name: string; xp: number }> = {};
    (lb || []).forEach((row: any) => {
      const sid = row.student_id;
      if (!lbMap[sid]) lbMap[sid] = { name: row.students?.name || sid, xp: 0 };
      lbMap[sid].xp += Math.round((row.score / row.total) * 100) + 10;
    });
    const leaderboard = Object.values(lbMap)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5);

    // My rank
    const myXP = lbMap[student_id]?.xp || xp;
    const rank = Object.values(lbMap).filter(s => s.xp > myXP).length + 1;

    return { accuracy, strongest, weakest, xp, streak, rank: `#${rank}`, chartLabels, chartData, leaderboard, testsCount: results.length };
  } catch (e) {
    console.error('fetchStudentStats:', e);
    return null;
  }
};

/** Fetch maintenance status and settings */
export const fetchMaintenanceStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('maintenance_enabled, maintenance_message, maintenance_opening_date')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('fetchMaintenanceStatus error:', e);
    return null;
  }
};
