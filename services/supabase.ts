
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hkdkhzfdmvcxvopasohm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZGtoemZkbXZjeHZvcGFzb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDU2NzgsImV4cCI6MjA4Njg4MTY3OH0.7It-Dx1QyTyaIFRgsIb46y6IoHOl13RFGaUvXBwkKPI';

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
}) => {
  try {
    // 1. Create user in Supabase Authentication (Handles secure hashing)
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
        is_verified: true // Set to true by default as requested
      }])
      .select()
      .single();

    if (profileError) {
      // Cleanup auth user if profile creation fails
      // Note: Supabase doesn't easily allow client-side deletion, usually handled by triggers
      throw profileError;
    }

    return profileData;
  } catch (err) {
    if ((err as any).code === '23505') {
      throw new Error('This email or Student ID is already registered.');
    }
    console.error('Registration error:', err);
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
      .select('id, name, student_id, email, dob, class, stream, phone, is_verified')
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
