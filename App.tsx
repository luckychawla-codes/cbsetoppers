// CBSE TOPPERS - Premium Education Platform
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, User, QuizResult, Question } from './types';
import { PAPER_1_QUESTIONS, CASE_STUDIES_P1, PAPER_2_QUESTIONS, CASE_STUDIES_P2 } from './constants';
import { saveResult, verifyStudent, fetchUserAttemptCount, fetchUserResults, registerStudent } from './services/supabase';

const EXAM_DURATION = 90 * 60;
const MAX_ATTEMPTS = 5;
const LOGO_URL = "https://i.ibb.co/vC4MYFFk/1770137585956.png";
const TG_CHANNEL = "https://t.me/CBSET0PPERS";
const TG_GROUP = "https://t.me/CBSET0PPER";
const TG_PHYSICS = "https://t.me/TusharPatelPHYSICSNEET";
const CONTACT_FOUNDER = "https://t.me/seniiiorr";
const CONTACT_OWNER = "https://t.me/tarun_kumar_in";
const EMAIL_FOUNDER = "luckychawla@zohomail.in";
const EMAIL_OWNER = "tarun.pncml123@gmail.com";

const SUBJECTS = [
  "Music",
  "Physical Education",
  "Physics",
  "Fine Arts",
  "Chemistry",
  "Maths Core",
  "English Core",
  "Biology"
];

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const generateStudentID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const TypingPartnershipText: React.FC = () => {
  const text = "CBSE TOPPERS ⨯ Monster of Physics";
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0; setDisplayed('');
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full flex items-center justify-center my-4">
      <div className="bg-violet-50 border border-violet-100 text-violet-600 px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2">
        <span className="text-[10px] md:text-[12px] font-black uppercase tracking-tight min-h-[1.2em]">
          {displayed}<span className="animate-pulse ml-0.5">|</span>
        </span>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [hasJoinedTG, setHasJoinedTG] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDOB, setRegDOB] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regStream, setRegStream] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [generatedID, setGeneratedID] = useState('');
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showLegal, setShowLegal] = useState<null | 'privacy' | 'terms'>(null);

  const handleLogin = async () => {
    if (!name.trim() || !roll.trim()) return setError('Required: Name and ID/Email');
    setIsVerifying(true); setError('');
    try {
      const student = await verifyStudent(name, roll);
      if (student) onLogin({ id: String(student.id), name: student.name, rollNumber: student.student_id });
      else setError('Verification failed. Check your ID or Email.');
    } catch (e) { setError('Network error. Try again.'); } finally { setIsVerifying(false); }
  };

  const handleRegistration = async () => {
    if (!regName.trim() || !regDOB || !regClass || !regEmail.trim() || !regPassword || !regConfirmPassword) {
      return setError('Please fill all required fields.');
    }
    if (regClass === 'XIIth' && !regStream) {
      return setError('Please select your stream.');
    }
    if (regPassword !== regConfirmPassword) {
      return setError('Passwords do not match.');
    }
    if (regPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setIsVerifying(true); setError('');
    const newID = generateStudentID();
    try {
      const student = await registerStudent({
        name: regName,
        dob: regDOB,
        studentClass: regClass,
        stream: regClass === 'XIIth' ? regStream : undefined,
        email: regEmail,
        phone: regPhone || undefined,
        password: regPassword,
        rollNumber: newID
      });
      if (student) {
        onLogin({ id: String(student.id), name: student.name, rollNumber: student.student_id });
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed. Try a different email.');
    } finally { setIsVerifying(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden text-left">
      <div className="max-w-sm w-full text-center animate-in fade-in zoom-in duration-700">
        <img src={LOGO_URL} className="w-20 h-20 mx-auto rounded-[1.2rem] mb-4 shadow-lg border border-slate-50" />
        <h1 className="text-2xl font-black text-violet-600 mb-0.5 uppercase tracking-tighter">CBSE TOPPERS</h1>
        {!isRegistering ? (
          <div className="flex flex-col items-center">
            <div className="animate-pulse bg-red-600 text-white text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest mb-1">Live for 2026 EXAMS</div>
            <TypingPartnershipText />
            <div className="space-y-4 text-left w-full mt-2">
              <input type="text" placeholder="Full Name" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="text" placeholder="Email or Student ID" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm tracking-widest outline-none focus:ring-2 focus:ring-violet-100" value={roll} onChange={(e) => setRoll(e.target.value)} />
              {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-xl text-center border border-red-100">{error}</p>}
              <button onClick={handleLogin} disabled={isVerifying} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                {isVerifying ? 'Verifying...' : 'Enter Dashboard'}
              </button>
              <button onClick={() => { setIsRegistering(true); setError(''); setRegStep(1); }} className="w-full text-[9px] font-black uppercase text-violet-500 tracking-widest py-2 text-center">New User? Register Now</button>
              <div className="flex justify-center items-center gap-6 mt-6 pt-6 border-t border-slate-50">
                <button onClick={() => setShowLegal('privacy')} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-violet-600 transition-all flex items-center gap-2">
                  <div className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-violet-600" />
                  Privacy Policy
                </button>
                <div className="h-4 w-px bg-slate-100" />
                <button onClick={() => setShowLegal('terms')} className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-violet-600 transition-all flex items-center gap-2">
                  Terms & Conditions
                  <div className="w-1 h-1 bg-slate-300 rounded-full group-hover:bg-violet-600" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left animate-in slide-in-from-right-4 duration-500">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${regStep >= s ? 'bg-violet-600' : 'bg-slate-100'}`} />)}
            </div>
            {regStep === 1 && (
              <div className="space-y-3">
                <div className="px-1 text-center mb-2">
                  <h3 className="font-black text-[11px] uppercase text-slate-800 tracking-tight mb-1">Step 01: Community Access</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Join our handles to proceed</p>
                </div>
                <div className="space-y-4">
                  <a href={TG_CHANNEL} target="_blank" className="flex items-center justify-between px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-violet-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-700 tracking-widest group-hover:text-violet-600 transition-colors">Official Channel</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={TG_GROUP} target="_blank" className="flex items-center justify-between px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-violet-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-700 tracking-widest group-hover:text-violet-600 transition-colors">Discussion Group</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={TG_PHYSICS} target="_blank" className="flex items-center justify-between px-6 py-5 bg-violet-50 border border-violet-100 rounded-2xl group hover:bg-violet-600 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white text-violet-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase text-violet-600 group-hover:text-white transition-colors">Monster of Physics</span>
                    </div>
                    <svg className="w-4 h-4 text-violet-300 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer mt-4 active:scale-95 transition-transform">
                  <input type="checkbox" checked={hasJoinedTG} onChange={(e) => setHasJoinedTG(e.target.checked)} className="w-5 h-5 rounded-lg text-violet-600 focus:ring-violet-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500">I have joined all community handles</span>
                </label>
                <button disabled={!hasJoinedTG} onClick={() => setRegStep(2)} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-violet-700 active:scale-95 disabled:opacity-50">Continue</button>
              </div>
            )}
            {regStep === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="px-1 text-center mb-2">
                  <h3 className="font-black text-[11px] uppercase text-slate-800 tracking-tight mb-1">Step 02: Personal Details</h3>
                </div>
                <input type="text" placeholder="Full Name (for certificate)" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regName} onChange={(e) => setRegName(e.target.value)} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-4">Date of Birth</p>
                  <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regDOB} onChange={(e) => setRegDOB(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Xth', 'XIIth'].map(c => (
                    <button key={c} onClick={() => setRegClass(c)} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${regClass === c ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>{c}</button>
                  ))}
                </div>
                {regClass === 'XIIth' && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-300">
                    {['PCB', 'PCM', 'Commerce', 'Humanities'].map(s => (
                      <button key={s} onClick={() => setRegStream(s)} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-tighter border-2 transition-all ${regStream === s ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{s}</button>
                    ))}
                  </div>
                )}
                {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-xl text-center border border-red-100">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setRegStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button onClick={() => { if (!regName || !regDOB || !regClass) return setError('Fill all details'); if (regClass === 'XIIth' && !regStream) return setError('Select stream'); setError(''); setRegStep(3); }} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Next Step</button>
                </div>
              </div>
            )}
            {regStep === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="px-1 text-center mb-2">
                  <h3 className="font-black text-[11px] uppercase text-slate-800 tracking-tight mb-1">Step 03: Security & Contact</h3>
                </div>
                <input type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                <input type="tel" placeholder="Phone Number (Optional)" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                <input type="password" placeholder="Create Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                <input type="password" placeholder="Confirm Password" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} />
                {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-xl text-center border border-red-100">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setRegStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button disabled={isVerifying} onClick={handleRegistration} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">
                    {isVerifying ? 'Creating Account...' : 'Generate Student ID'}
                  </button>
                </div>
              </div>
            )}
            {regStep === 4 && (
              <div className="space-y-6 text-center animate-in zoom-in duration-500">
                <div className="bg-black p-8 rounded-[2rem] shadow-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-violet-400 uppercase mb-3 tracking-[0.2em]">Registration Successful</p>
                  <p className="text-4xl font-black text-white tracking-widest mb-2">{generatedID}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Save this ID for all future logins</p>
                </div>
                <button onClick={() => { setIsRegistering(false); setName(regName); setRoll(generatedID); setError(''); }} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Back to Login</button>
                <div className="flex justify-center gap-4 mt-6">
                  <button onClick={() => setShowLegal('privacy')} className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-colors">Privacy Policy</button>
                  <span className="text-slate-200">|</span>
                  <button onClick={() => setShowLegal('terms')} className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hover:text-violet-600 transition-colors">Terms & Conditions</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showLegal && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowLegal(null)} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 p-8 pt-10 animate-in slide-in-from-bottom-full duration-500 flex flex-col max-h-[80vh]">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0" />
            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-6">
                {showLegal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <div className="space-y-6 text-slate-600 text-sm leading-relaxed font-medium">
                {showLegal === 'privacy' ? (
                  <>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">1. Data Collection</h4>
                      <p>We collect basic information like your name, email, roll number, and date of birth to provide a personalized assessment experience and generate valid certificates.</p>
                    </section>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">2. Usage of Information</h4>
                      <p>Your data is used solely for identifying you within the CBSE TOPPERS portal, tracking your mock test progress, and providing support via Telegram.</p>
                    </section>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">3. Data Security</h4>
                      <p>We implement strict security measures to protect your personal details. We do not sell or share your personal data with third-party advertisers.</p>
                    </section>
                  </>
                ) : (
                  <>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">1. Platform Usage</h4>
                      <p>CBSE TOPPERS is an educational tool for mock assessments. Users are expected to use the platform for legitimate preparation purposes only.</p>
                    </section>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">2. Account Integrity</h4>
                      <p>Each 8-digit Roll ID is unique to a user. Sharing accounts or attempting to bypass assessment limits (5 attempts per paper) is strictly prohibited.</p>
                    </section>
                    <section>
                      <h4 className="font-black text-slate-800 uppercase text-xs mb-2 tracking-widest">3. Intellectual Property</h4>
                      <p>All questions, narratives, and branding are the property of CBSE TOPPERS and its partners. Unauthorized reproduction is forbidden.</p>
                    </section>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setShowLegal(null)} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 shrink-0">I Understand</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<{ user: User, onStart: (subj: string, pid: string) => void, onViewHistory: (res: any) => void }> = ({ user, onStart, onViewHistory }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { attempts: number, history: any[] }>>({});
  const [loading, setLoading] = useState(false);
  const [showTgMenu, setShowTgMenu] = useState(false);

  const fetchSubjectStats = useCallback(async (subj: string) => {
    setLoading(true);
    try {
      const papers = ['P1', 'P2', 'Mock'];
      const results: any = {};
      for (const pid of papers) {
        const [count, hist] = await Promise.all([
          fetchUserAttemptCount(user.id, subj, pid),
          fetchUserResults(user.id, subj, pid)
        ]);
        results[pid] = { attempts: count, history: hist };
      }
      setStats(results);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { if (selectedSubject) fetchSubjectStats(selectedSubject); }, [selectedSubject, fetchSubjectStats]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative text-left">
      <header className="bg-white border-b px-6 md:px-12 py-5 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-sm" />
          <div className="text-left">
            <h2 className="text-[14px] md:text-lg font-black uppercase leading-tight text-slate-800 tracking-tighter">CBSE TOPPERS</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-violet-600 font-black text-[10px] md:text-[12px] uppercase">{user.name}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-slate-400 font-bold text-[10px] md:text-[12px] uppercase">ID: {user.rollNumber}</span>
            </div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('pe_cbt_session'); window.location.reload(); }} className="bg-slate-50 p-2.5 rounded-xl text-slate-400 hover:text-red-500 border border-slate-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-12">
        {!selectedSubject ? (
          <div className="animate-in fade-in duration-700">
            <div className="mb-10 text-center">
              <h2 className="text-2xl md:text-4xl font-black text-violet-600 uppercase tracking-tighter leading-tight mb-1">
                Ready for Success, {user.name.split(' ')[0]}?
              </h2>
              <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em]">
                Select a Subject to start MOCK TEST
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {SUBJECTS.map((subj) => (
                <button key={subj} onClick={() => setSelectedSubject(subj)} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-violet-400 hover:shadow-2xl transition-all text-center flex flex-col items-center gap-5 group animate-in slide-in-from-bottom-4">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <span className="text-[12px] md:text-[14px] font-black uppercase text-slate-800 tracking-tight leading-none">{subj}</span>
                </button>
              ))}
            </div>

            <div className="mt-16 md:mt-24 text-center pb-24 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-5xl md:text-[10rem] font-black text-slate-900/5 uppercase tracking-tighter leading-none absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 select-none pointer-events-none">GO CONQUER</h2>
                <p className="text-violet-500 font-black text-[10px] md:text-sm uppercase tracking-[0.8em] mb-6">ULTIMATE BOARD PREPARATION</p>
                <h3 className="text-4xl md:text-[6rem] font-black text-slate-900 uppercase tracking-tighter leading-[0.85] mb-10">CHASE YOUR DREAMS, <br /><span className="text-violet-600">{user.name.split(' ')[0]}!</span></h3>
                <div className="max-w-2xl mx-auto border-t-2 border-violet-50 pt-10 mt-2">
                  <p className="text-slate-400 font-black text-xl md:text-4xl uppercase tracking-[0.2em] opacity-90 leading-tight">ALL THE BEST FOR YOUR EXAM</p>
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <div className="h-[2px] w-8 bg-slate-200"></div>
                    <p className="text-slate-300 font-bold text-[9px] md:text-[11px] uppercase tracking-[0.5em]">BELIEVE IN YOURSELF</p>
                    <div className="h-[2px] w-8 bg-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <button onClick={() => { setSelectedSubject(null); setStats({}); }} className="mb-10 flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-violet-600 transition-all active:scale-95">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></div>
              Back to Portal
            </button>
            <div className="flex flex-col items-center md:items-start text-center md:text-left mb-12">
              <h3 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedSubject}</h3>
              {selectedSubject === "Physics" && <TypingPartnershipText />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['P1', 'P2', 'Mock'].map(pid => {
                const s = stats[pid] || { attempts: 0, history: [] };
                const canStart = s.attempts < MAX_ATTEMPTS;
                return (
                  <div key={pid} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col hover:shadow-2xl transition-all relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:bg-violet-600 transition-all duration-500" />
                    <div className="text-left relative z-10">
                      <h4 className="font-black text-base uppercase text-slate-900 mb-8">{pid === 'P1' ? 'Assessment P-1' : pid === 'P2' ? 'Assessment P-2' : 'Full Mock Exam'}</h4>
                      <div className="mb-10 flex flex-col">
                        <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-slate-900 tracking-tighter">{s.attempts}</span><span className="text-slate-200 font-bold text-2xl">/ {MAX_ATTEMPTS}</span></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Completed Sessions</span>
                      </div>
                      <button onClick={() => onStart(selectedSubject, pid)} disabled={!canStart || loading} className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all ${canStart ? 'bg-violet-600 text-white shadow-xl hover:bg-violet-700 active:scale-95' : 'bg-slate-100 text-slate-300'}`}>
                        {loading ? 'SYNCING...' : canStart ? 'Launch Assessment' : 'Quota Full'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Telegram Bottom Sheet Support */}
      {showTgMenu && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowTgMenu(false)}
          />
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 p-8 pb-10 animate-in slide-in-from-bottom-full duration-500">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Support Center</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Connect with our administration</p>
            </div>

            <div className="space-y-4">
              <a href={CONTACT_FOUNDER} target="_blank" onClick={() => setShowTgMenu(false)} className="flex items-center gap-5 p-6 bg-violet-50/50 rounded-[2rem] group border-2 border-transparent hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-slate-800 leading-none flex items-center gap-2">
                    Lucky Chawla
                    <span className="text-[9px] w-5 h-5 flex items-center justify-center bg-violet-600 text-white rounded-full shadow-sm">F</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{EMAIL_FOUNDER}</p>
                </div>
              </a>

              <a href={CONTACT_OWNER} target="_blank" onClick={() => setShowTgMenu(false)} className="flex items-center gap-5 p-6 bg-sky-50/50 rounded-[2rem] group border-2 border-transparent hover:border-sky-200 hover:bg-white transition-all shadow-sm">
                <div className="w-16 h-16 bg-[#0088cc] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-slate-800 leading-none flex items-center gap-2">
                    Tarun Chaudhary
                    <span className="text-[9px] w-5 h-5 flex items-center justify-center bg-sky-500 text-white rounded-full shadow-sm">O</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{EMAIL_OWNER}</p>
                </div>
              </a>
            </div>

            <button
              onClick={() => setShowTgMenu(false)}
              className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Close Support
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowTgMenu(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#0088cc] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[350] border-4 border-white"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
      </button>
    </div>
  );
};

// QuizEngine, ResultView components remain the same as they are stable
const QuizEngine: React.FC<{ subject: string, paperId: string, onFinish: (res: QuizResult) => void }> = ({ subject, paperId, onFinish }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(100).fill(null));
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submitting, setSubmitting] = useState(false);
  const questions = useMemo(() => paperId === 'P2' ? PAPER_2_QUESTIONS : PAPER_1_QUESTIONS, [paperId]);
  const currentQ = questions[currentIdx];
  const caseStudy = (paperId === 'P2' ? CASE_STUDIES_P2 : CASE_STUDIES_P1).find(c => c.questionIds.includes(currentIdx + 1));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    let score = 0;
    answers.forEach((ans, idx) => { if (ans === questions[idx].answer) score++; });
    onFinish({ score, total: 100, subject, paperId, answers, timestamp: Date.now(), timeSpent: EXAM_DURATION - timeLeft });
  }, [answers, questions, subject, paperId, timeLeft, onFinish]);

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden text-left">
      <header className="bg-slate-900 text-white p-5 flex justify-between items-center">
        <div className="bg-slate-800 px-6 py-2 rounded-xl font-mono text-xl font-black text-violet-400 border border-slate-700">{formatTime(timeLeft)}</div>
        <button onClick={() => confirm('Submit exam?') && handleSubmit()} disabled={submitting} className="bg-red-600 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 active:scale-95 disabled:opacity-50">{submitting ? 'SYNC...' : 'SUBMIT'}</button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-14 bg-black">
        <div className="max-w-3xl mx-auto space-y-8">
          {caseStudy && (
            <div className="bg-violet-600 text-white p-8 rounded-[2rem] shadow-xl text-left border-l-[12px] border-violet-400">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Source Material {caseStudy.id}</p>
              <p className="text-base font-medium italic leading-relaxed">{caseStudy.narrative}</p>
            </div>
          )}
          <div className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-sm text-left">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-10">{currentQ.question}</h2>
            <div className="grid grid-cols-1 gap-4">
              {currentQ.options.map((opt, i) => (
                <button key={i} onClick={() => { const n = [...answers]; n[currentIdx] = i; setAnswers(n); }} className={`w-full text-left p-6 rounded-[1.5rem] border-2 font-bold flex items-center gap-6 transition-all ${answers[currentIdx] === i ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100'}`}>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${answers[currentIdx] === i ? 'bg-white text-violet-600' : 'bg-white border-slate-200 text-slate-400 border'}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-lg">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      <footer className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between gap-4">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(c => c - 1)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px] text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-30">Back</button>
        <button disabled={currentIdx === 99} onClick={() => setCurrentIdx(c => c + 1)} className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] hover:bg-black transition-colors disabled:opacity-30">Next</button>
      </footer>
    </div>
  );
};

const ResultView: React.FC<{ result: QuizResult, onDone: () => void }> = ({ result, onDone }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 animate-in fade-in duration-700 text-left">
    <div className="max-w-xl w-full text-center mt-20">
      <div className="bg-violet-600 rounded-[4rem] p-20 text-white shadow-3xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">{result.subject}</p>
        <div className="text-[12rem] font-black leading-none tracking-tighter animate-in zoom-in duration-1000 delay-200">{result.score}</div>
        <p className="text-xl font-bold opacity-30 uppercase tracking-[0.3em]">SCORE / 100</p>
      </div>
      <button onClick={onDone} className="w-full py-6 bg-violet-600 rounded-[2rem] font-black text-white uppercase tracking-widest shadow-xl hover:bg-violet-700 active:scale-95 transition-all">Back to Portal</button>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<View>(View.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [examConfig, setExamConfig] = useState<{ subj: string, pid: string } | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pe_cbt_session');
    if (saved) {
      try { setUser(JSON.parse(saved).user); setView(View.DASHBOARD); } catch (e) { localStorage.removeItem('pe_cbt_session'); }
    }
  }, []);

  const handleFinish = async (res: QuizResult) => {
    if (user) await saveResult({ student_id: user.id, name: user.name, score: res.score, paper_id: res.paperId, subject: res.subject, answers: res.answers });
    setQuizResult(res); setView(View.RESULT);
  };

  return (
    <div className="min-h-screen-safe font-['Plus_Jakarta_Sans'] text-slate-900 selection:bg-violet-100 overflow-x-hidden antialiased text-left">
      {view === View.AUTH && <AuthScreen onLogin={u => { setUser(u); setView(View.DASHBOARD); localStorage.setItem('pe_cbt_session', JSON.stringify({ user: u })); }} />}
      {view === View.DASHBOARD && user && <Dashboard user={user} onStart={(subj, pid) => { setExamConfig({ subj, pid }); setView(View.QUIZ); }} onViewHistory={h => { setQuizResult({ ...h, timestamp: 0, timeSpent: 0 }); setView(View.RESULT); }} />}
      {view === View.QUIZ && examConfig && <QuizEngine subject={examConfig.subj} paperId={examConfig.pid} onFinish={handleFinish} />}
      {view === View.RESULT && quizResult && <ResultView result={quizResult} onDone={() => { setView(View.DASHBOARD); setQuizResult(null); setExamConfig(null); }} />}
    </div>
  );
}
