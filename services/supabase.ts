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
}) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('student_id', studentId)
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
      .select('id, name, student_id, email, dob, class, stream, phone, gender, is_verified')
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
