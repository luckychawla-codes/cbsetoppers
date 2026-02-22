// CBSE TOPPERS - Premium Education Platform
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, QuizResult, Question } from './types';
import { PAPER_1_QUESTIONS, CASE_STUDIES_P1, PAPER_2_QUESTIONS, CASE_STUDIES_P2 } from './constants';
import { verifyStudent, registerStudent, supabase } from './services/supabase';
import { analyzeResult, generateAIQuiz, getMotivationalQuote } from './services/ai';
import AIChatWidget from './AIChatWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const LatexRenderer: React.FC<{ content: string, className?: string }> = ({ content, className }) => {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-xl font-black uppercase mb-4 text-slate-900" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-black uppercase mb-3 text-slate-800" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-md font-black uppercase mb-2 text-slate-700" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-slate-600 font-medium" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-2 mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-2 mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="text-slate-600" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-black text-violet-600" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
const SimpleLatex: React.FC<{ content: string, className?: string }> = ({ content, className }) => {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ node, ...props }) => <span {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Timer: 90 seconds (1.5 min) per MCQ question — e.g. 10 Qs = 15 min, 20 Qs = 30 min
const SECONDS_PER_QUESTION = 90;
// Logo used for PDF watermark — served from /public/favicon.png on the deployed site
const PDF_LOGO_URL = "/favicon.png";

// Helper: fetch an image URL and return base64 data URL
const fetchImageAsBase64 = (url: string): Promise<string> =>
  fetch(url)
    .then(r => r.blob())
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));

// Helper: add semi-transparent logo watermark to every page of a jsPDF doc
const addLogoWatermark = (doc: any, logoBase64: string) => {
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    // Centre watermark logo
    const logoSize = 60;
    const lx = (pw - logoSize) / 2;
    const ly = (ph - logoSize) / 2;
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
    doc.addImage(logoBase64, 'PNG', lx, ly, logoSize, logoSize);
    // Diagonal brand text
    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // green-600
    doc.text('CBSE TOPPERS', pw / 2, ph / 2 + 36, { angle: 45, align: 'center' });
    doc.restoreGraphicsState();
    // Small logo in top-right of every page
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
    doc.addImage(logoBase64, 'PNG', pw - 24, 4, 18, 18);
    doc.restoreGraphicsState();
  }
};
const MAX_ATTEMPTS = 5;
const LOGO_URL = "https://i.ibb.co/vC4MYFFk/1770137585956.png";
const TG_CHANNEL = "https://t.me/CBSET0PPERS";
const TG_GROUP = "https://t.me/CBSET0PPER";
const TG_PHYSICS = "https://t.me/TusharPatelPHYSICSNEET";
const CONTACT_FOUNDER = "https://t.me/seniiiorr";
const CONTACT_OWNER = "https://t.me/tarun_kumar_in";
const EMAIL_FOUNDER = "luckychawla@zohomail.in";
const EMAIL_OWNER = "tarun.pncml123@gmail.com";


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

const TypingGreeting: React.FC<{ name: string }> = ({ name }) => {
  const fullText = `Ready for Success, ${name}?`;
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0; setDisplayed('');
    const timer = setInterval(() => {
      setDisplayed(fullText.substring(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [name]);
  return <>{displayed}</>;
};

const AuthScreen: React.FC<{ onLogin: (u: User) => void, setView: (v: View) => void }> = ({ onLogin, setView }) => {
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
  const [roll, setRoll] = useState('');
  const [password, setPassword] = useState('');
  const [regGender, setRegGender] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showLegal, setShowLegal] = useState<null | 'privacy' | 'terms'>(null);

  const handleLogin = async () => {
    if (!roll.trim() || !password.trim()) return setError('Required: Email/ID and Password');
    setIsVerifying(true); setError('');
    try {
      const student = await verifyStudent(roll, password);
      if (student) onLogin({ id: String(student.id), name: student.name, student_id: student.student_id, dob: student.dob, email: student.email, class: student.class, stream: student.stream, phone: student.phone, gender: student.gender });
      else setError('Verification failed. Check ID or Email.');
    } catch (e: any) {
      setError(e.message === 'Incorrect password' ? 'Incorrect Password' : 'Network error. Try again.');
    } finally { setIsVerifying(false); }
  };

  const handleRegistration = async () => {
    if (!regName.trim() || !regDOB || !regClass || !regEmail.trim() || !regPassword || !regConfirmPassword || !regGender) {
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
        rollNumber: newID,
        gender: regGender
      });
      if (student) {
        onLogin({ id: String(student.id), name: student.name, student_id: student.student_id, dob: student.dob, email: student.email, class: student.class, stream: student.stream, phone: student.phone, gender: student.gender });
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
              <input type="text" placeholder="Email or Student ID" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={roll} onChange={(e) => setRoll(e.target.value)} />
              <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100" value={password} onChange={(e) => setPassword(e.target.value)} />
              {error && (
                <div className="space-y-3">
                  <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-xl text-center border border-red-100">{error}</p>
                  {error.toLowerCase().includes('verification') && resendCooldown === 0 && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setResendCooldown(60);
                          const timer = setInterval(() => setResendCooldown(c => {
                            if (c <= 1) { clearInterval(timer); return 0; }
                            return c - 1;
                          }), 1000);
                          alert('Verification link resent to your email!');
                        }}
                        className="w-full text-violet-600 font-black uppercase text-[9px] tracking-widest py-1 underline decoration-2 underline-offset-4"
                      >
                        Resend Verification Link
                      </button>
                      <button
                        onClick={() => setView('verify')}
                        className="w-full text-slate-400 font-black uppercase text-[9px] tracking-widest py-1 border border-slate-100 rounded-xl"
                      >
                        Try Verification Bypass
                      </button>
                    </div>
                  )}
                  {resendCooldown > 0 && (
                    <p className="text-slate-400 font-bold uppercase text-[8px] tracking-widest text-center">Wait {resendCooldown}s to resend again</p>
                  )}
                </div>
              )}
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
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-4">Select Gender</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['MALE', 'FEMALE', 'PREFER_NOT_SAY'].map(g => (
                      <button key={g} onClick={() => setRegGender(g)} className={`py-3 rounded-xl font-black text-[8px] uppercase tracking-tighter border-2 transition-all ${regGender === g ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>{g.replace(/_/g, ' ')}</button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-xl text-center border border-red-100">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setRegStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button onClick={() => { if (!regName || !regDOB || !regClass || !regGender) return setError('Fill all details'); if (regClass === 'XIIth' && !regStream) return setError('Select stream'); setError(''); setRegStep(3); }} className="flex-[2] py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Next Step</button>
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
                <button onClick={() => { setIsRegistering(false); setRoll(generatedID); setError(''); }} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Back to Login</button>
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

const MotivationalQuote: React.FC<{ user: User }> = ({ user }) => {
  const [quote, setQuote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = await getMotivationalQuote(user);
      if (q) setQuote(q);
      else setError(true);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 mt-6 animate-in slide-in-from-top-4 duration-1000">
      <div className="bg-violet-50/50 backdrop-blur-sm p-4 md:p-6 rounded-3xl border border-violet-100/50 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left transition-all hover:bg-white hover:shadow-xl hover:shadow-violet-500/5 group shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/10 text-violet-600 rounded-xl flex items-center justify-center shrink-0 border border-violet-100 shadow-sm group-hover:bg-violet-600 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-violet-500/60 mb-0.5">Today's Guidance</p>
            <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-tight italic">
              {loading ? (
                <span className="opacity-40 animate-pulse text-violet-400">Tuning into your frequency...</span>
              ) : error ? (
                <span className="text-slate-400">Push yourself, because no one else is going to do it for you. 🚀</span>
              ) : (
                `"${quote}"`
              )}
            </h3>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="h-1 w-1 rounded-full bg-violet-300" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mentor: TopperAI</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  user: User,
  onStartExam: (subj: string, pid: string) => void,
  setView: (v: View) => void,
  selectedSubject: string | null,
  setSelectedSubject: (s: string | null) => void
}> = ({ user, onStartExam, setView, selectedSubject, setSelectedSubject }) => {
  const [showTgMenu, setShowTgMenu] = useState(false);
  const [showLegalSide, setShowLegalSide] = useState<'privacy' | 'terms' | 'refund' | 'honor' | null>(null);

  const { coreSubjects, additionalSubjects } = useMemo(() => {
    const universalAdditional = ["Physical Education", "Computer Science", "Music", "Fine Arts"];

    if (user.class === 'Xth') {
      return {
        coreSubjects: ["Science", "Mathematics", "Social Science", "English"],
        additionalSubjects: Array.from(new Set(["Hindi", ...universalAdditional]))
      };
    }

    if (user.class === 'XIIth') {
      let core: string[] = [];
      let extra: string[] = [];

      switch (user.stream) {
        case 'PCM':
          core = ["Physics", "Chemistry", "Mathematics", "English Core"];
          extra = ["Economics"];
          break;
        case 'PCB':
          core = ["Physics", "Chemistry", "Biology", "English Core"];
          extra = ["Psychology", "Biotechnology"];
          break;
        case 'Commerce':
          core = ["Accountancy", "Business Studies", "Economics", "English Core"];
          extra = ["Mathematics", "Informatics Practices"];
          break;
        case 'Humanities':
          core = ["History", "Political Science", "Geography", "English Core"];
          extra = ["Psychology", "Sociology"];
          break;
        default:
          core = ["English Core"];
      }
      return {
        coreSubjects: core,
        additionalSubjects: Array.from(new Set([...extra, ...universalAdditional]))
      };
    }
    return { coreSubjects: ["English Core"], additionalSubjects: universalAdditional };
  }, [user.class, user.stream]);

  const renderSubjectCard = (subj: string, isCore: boolean) => (
    <button key={subj} onClick={() => setSelectedSubject(subj)} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:border-violet-400 hover:shadow-2xl transition-all text-center flex flex-col items-center gap-4 group animate-in slide-in-from-bottom-4 relative overflow-hidden">
      {isCore && <div className="absolute top-0 right-0 px-3 py-1 bg-violet-600 text-[8px] font-black text-white uppercase rounded-bl-xl tracking-widest z-10">Core</div>}
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      </div>
      <span className="text-[11px] md:text-[13px] font-black uppercase text-slate-800 tracking-tight leading-tight">{subj}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 relative text-left">
      <header className="bg-white border-b px-6 md:px-12 py-4 md:py-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3 md:gap-4">
          <img src={LOGO_URL} className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl shadow-sm" />
          <div className="text-left">
            <h2 className="text-[12px] md:text-lg font-black uppercase leading-tight text-slate-800 tracking-tighter">CBSE TOPPERS</h2>
            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
              <span className="text-violet-600 font-black text-[9px] md:text-[12px] uppercase">{user.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setShowTgMenu(true)} className="bg-sky-50 p-2 md:p-2.5 rounded-xl text-[#0088cc] hover:bg-[#0088cc] hover:text-white border border-sky-100 transition-all active:scale-95">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
          </button>
          <button onClick={() => setView('profile')} className="bg-violet-50 p-2 md:p-2.5 rounded-xl text-violet-600 hover:bg-violet-600 hover:text-white border border-violet-100 transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>
      </header>


      <MotivationalQuote user={user} />

      <main className="max-w-6xl mx-auto p-4 md:p-12">
        {!selectedSubject ? (
          <div className="animate-in fade-in duration-700">
            <div className="mb-10 text-center">
              <h2 className="text-2xl md:text-4xl font-black text-violet-600 uppercase tracking-tighter leading-tight mb-1 min-h-[1.2em]">
                <TypingGreeting name={user.name.split(' ')[0]} />
              </h2>
              <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.3em]">
                Select a Subject to start MOCK TEST
              </p>
            </div>

            <section className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-slate-100" />
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Core Subjects</h3>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {coreSubjects.map(subj => renderSubjectCard(subj, true))}
              </div>
            </section>

            <section className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-slate-100" />
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Additional Subjects</h3>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {additionalSubjects.map(subj => renderSubjectCard(subj, false))}
              </div>
            </section>

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
            <button onClick={() => setSelectedSubject(null)} className="mb-10 flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 hover:text-violet-600 transition-all active:scale-95">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 v-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></div>
              Back to Portal
            </button>
            <div className="flex flex-col items-center md:items-start text-center md:text-left mb-12">
              <h3 className="text-3xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedSubject}</h3>
              {selectedSubject === "Physics" && <TypingPartnershipText />}
            </div>
            <div className="bg-white p-6 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-violet-100 relative overflow-hidden text-center md:text-left animate-in zoom-in duration-500">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-100/30 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

              <div className="relative z-10">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-violet-600 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mb-6 md:mb-10 shadow-2xl shadow-violet-200 mx-auto md:mx-0 animate-bounce-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-12 md:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <h4 className="text-2xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight max-w-4xl">NO QUIzes are avaible right now.</h4>
                  <p className="text-sm md:text-xl font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-3xl">
                    Stay updated we will add quize soon. Meanwhile you can create a <span className="text-violet-600">custom AI test</span> by chatting with our AI mentor below.
                  </p>
                </div>

                <div className="mt-12 md:mt-20 flex flex-col md:flex-row items-center gap-6">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-topper-chat', { detail: { message: `Hey TopperAI, since there are no pre-built quizzes for ${selectedSubject}, can you create a custom 10-question mock test for me on this subject?` } }))}
                    className="w-full md:w-auto px-10 py-5 md:py-6 bg-violet-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-xs md:text-sm tracking-widest shadow-2xl shadow-violet-200 hover:bg-violet-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                  >
                    Create Custom AI Quiz
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>

                  <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest italic">
                    * AI can generate custom tests for any chapter in 10 seconds
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto p-12 pt-0">
        <div className="border-t-2 border-slate-100 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start transition-all">
            <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest mb-2">CBSE TOPPERS</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} All Rights Reserved</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            <button onClick={() => setShowLegalSide('privacy')} className="text-[9px] font-black uppercase text-slate-400 hover:text-violet-600 tracking-widest transition-colors">Privacy Policy</button>
            <button onClick={() => setShowLegalSide('terms')} className="text-[9px] font-black uppercase text-slate-400 hover:text-violet-600 tracking-widest transition-colors">Terms of Service</button>
            <button onClick={() => setShowLegalSide('refund')} className="text-[9px] font-black uppercase text-slate-400 hover:text-violet-600 tracking-widest transition-colors">Refund Policy</button>
            <button onClick={() => setShowLegalSide('honor')} className="text-[9px] font-black uppercase text-slate-400 hover:text-violet-600 tracking-widest transition-colors">Honor Code</button>
          </div>
        </div>
      </footer>

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

      {/* Legal Bottom Sheet */}
      {showLegalSide && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLegalSide(null)}
          />
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 p-10 pb-12 animate-in slide-in-from-bottom-full duration-500 overflow-hidden">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />

            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{LEGAL_DATA[showLegalSide].title}</h3>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.3em] mt-2">Compliance & Security</p>
            </div>

            <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {LEGAL_DATA[showLegalSide].content.map((item, idx) => (
                <div key={idx} className="space-y-2 text-left">
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{item.h}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.p}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLegalSide(null)}
              className="w-full mt-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Accept & Close
            </button>
          </div>
        </div>
      )}

      {/* Legal Bottom Sheet Removed Here as it's below in the logic */}
    </div>
  );
};

// QuizEngine, ResultView components remain the same as they are stable
const QuizEngine: React.FC<{ subject: string, paperId: string, onFinish: (res: QuizResult) => void, user: User }> = ({ subject, paperId, onFinish, user }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const questions = useMemo(() => {
    if (paperId === 'AI_DYNAMIC') {
      const saved = localStorage.getItem('topper_ai_quiz');
      return saved ? JSON.parse(saved) : PAPER_1_QUESTIONS;
    }
    return paperId === 'P2' ? PAPER_2_QUESTIONS : PAPER_1_QUESTIONS;
  }, [paperId]);

  // Calculate exam duration dynamically: 90 seconds per question
  const examDuration = useMemo(() => questions.length * SECONDS_PER_QUESTION, [questions]);
  const [timeLeft, setTimeLeft] = useState(examDuration);

  useEffect(() => {
    // Reset answers AND timer whenever questions change (new quiz loaded)
    setAnswers(new Array(questions.length).fill(null));
    setTimeLeft(questions.length * SECONDS_PER_QUESTION);
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [questions]);

  const handleFinish = () => {
    const score = answers.reduce((acc, ans, idx) => (ans === questions[idx].answer ? acc + 1 : acc), 0);
    onFinish({ score, total: questions.length, paperId, subject, answers, timestamp: Date.now(), timeSpent: examDuration - timeLeft });
  };

  const downloadPaperPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // violet-600
    doc.text('CBSE TOPPERS', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`${subject} - MOCK TEST PAPER`, 14, 32);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Generated by TopperAI Support System | 2026 Board Prep', 14, 40);

    let y = 55;
    questions.forEach((q, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      const qText = doc.splitTextToSize(`Q${i + 1}: ${q.question.replace(/\$/g, '')}`, 180);
      doc.text(qText, 14, y);
      y += qText.length * 5 + 2;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      q.options.forEach((opt, j) => {
        const optText = doc.splitTextToSize(`${String.fromCharCode(65 + j)}) ${opt.replace(/\$/g, '')}`, 170);
        doc.text(optText, 20, y);
        y += optText.length * 5 + 1;
      });

      y += 6;
    });

    // Add logo watermark to every page
    try {
      const logoBase64 = await fetchImageAsBase64(PDF_LOGO_URL);
      addLogoWatermark(doc, logoBase64);
    } catch (_) { /* watermark is optional, skip on error */ }

    doc.save(`CBSE_Toppers_${subject}_Paper.pdf`);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-violet-100">
          <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-violet-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Quiz Data Missing</h2>
          <p className="text-slate-500 mt-4 mb-8 font-bold text-sm uppercase tracking-widest">TopperAI couldn't find this quiz. Try creating one in the chat!</p>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans text-left">
      {/* Sidebar - Question Navigation */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col h-auto md:h-screen sticky top-0 md:relative z-20 transition-all duration-500">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-100">
              <img src={LOGO_URL} className="w-6 h-6 rounded" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">AI Mock Test</h1>
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest leading-none">{subject}</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 blur-2xl" />
            <div className="relative z-10 text-left">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Time Remaining</p>
              <p className={`text-2xl font-black font-mono tracking-tighter ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-5 md:grid-cols-4 gap-3">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-10 md:h-12 rounded-xl text-[11px] font-black transition-all border-2 flex items-center justify-center ${currentIdx === i ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-100 scale-105' : answers[i] !== null ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 space-y-3">
          <button
            onClick={downloadPaperPDF}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Paper PDF
          </button>
          <button onClick={handleFinish} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all">Submit Attempt</button>
        </div>
      </aside>

      {/* Main Content - Question Area */}
      <main className="flex-1 flex flex-col h-auto md:h-screen relative bg-white md:bg-slate-50 overflow-y-auto">
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 flex items-center justify-center">
          <div className="w-full bg-white md:rounded-[3.5rem] md:shadow-3xl md:border md:border-slate-50 p-8 md:p-16 animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />

            <div className="relative z-10 text-left">
              <div className="flex items-center gap-4 mb-10">
                <span className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-violet-200">Q{currentIdx + 1}</span>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
              </div>

              <h2 className="text-xl md:text-3xl font-black text-slate-900 leading-[1.35] tracking-tight mb-12 text-left">
                <SimpleLatex content={questions[currentIdx].question} />
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {questions[currentIdx].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newAns = [...answers];
                      newAns[currentIdx] = i;
                      setAnswers(newAns);
                    }}
                    className={`group w-full p-6 md:p-8 rounded-3xl text-left transition-all border-2 flex items-center gap-6 relative overflow-hidden ${answers[currentIdx] === i ? 'bg-violet-600 border-violet-600 text-white shadow-xl translate-x-3' : 'bg-slate-50 border-transparent hover:border-violet-100 hover:bg-white text-slate-700 active:scale-[0.98]'}`}
                  >
                    <span className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black transition-all ${answers[currentIdx] === i ? 'bg-white text-violet-600 shadow-md' : 'bg-white border-slate-200 text-slate-400 border group-hover:bg-violet-50 group-hover:text-violet-600'}`}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-base md:text-xl font-bold flex-1 text-left">
                      <SimpleLatex content={opt} />
                    </span>
                    {answers[currentIdx] === i && (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="p-6 md:p-12 bg-white md:bg-transparent flex justify-between gap-6 w-full max-w-4xl mx-auto items-center">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(c => c - 1)} className="flex-1 py-5 bg-white border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-violet-200 hover:text-violet-600 transition-all disabled:opacity-20 active:scale-95">Previous</button>

          <div className="hidden md:flex gap-2">
            {[...Array(Math.min(questions.length, 5))].map((_, i) => (
              <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${currentIdx === i ? 'bg-violet-600 w-8' : 'bg-slate-200'}`} />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIdx < questions.length - 1) setCurrentIdx(c => c + 1);
              else handleFinish();
            }}
            className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl"
          >
            {currentIdx === questions.length - 1 ? 'Finish Test' : 'Next Question'}
          </button>
        </footer>
      </main>
    </div>
  );
};

const ResultView: React.FC<{ result: QuizResult, onDone: () => void }> = ({ result, onDone }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAnalysis = async () => {
    setLoading(true);
    let questions = result.paperId === 'P2' ? PAPER_2_QUESTIONS : PAPER_1_QUESTIONS;
    if (result.paperId === 'AI_DYNAMIC') {
      const saved = localStorage.getItem('topper_ai_quiz');
      if (saved) questions = JSON.parse(saved);
    }
    const res = await analyzeResult(result, questions);
    setAnalysis(res);
    setLoading(false);
  };

  const downloadQuizPDF = async () => {
    const doc = new jsPDF();
    let questions = result.paperId === 'P2' ? PAPER_2_QUESTIONS : PAPER_1_QUESTIONS;
    if (result.paperId === 'AI_DYNAMIC') {
      const saved = localStorage.getItem('topper_ai_quiz');
      if (saved) questions = JSON.parse(saved);
    }

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // violet-600
    doc.text('CBSE TOPPERS', 14, 20);

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`${result.subject} - PERFORMANCE REPORT`, 14, 32);

    doc.setFontSize(10);
    doc.text(`Score: ${result.score} / ${result.total}`, 14, 42);
    doc.text(`Timestamp: ${new Date(result.timestamp).toLocaleString()}`, 14, 48);

    const tableData = questions.map((q, i) => [
      i + 1,
      q.question.replace(/\$/g, ''),
      result.answers[i] !== null ? q.options[result.answers[i]!].replace(/\$/g, '') : 'SKIP',
      q.options[q.answer].replace(/\$/g, '')
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['#', 'Question', 'Your Answer', 'Correct Answer']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { cellWidth: 90 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      }
    });

    // Add logo watermark to every page
    try {
      const logoBase64 = await fetchImageAsBase64(PDF_LOGO_URL);
      addLogoWatermark(doc, logoBase64);
    } catch (_) { /* watermark is optional, skip on error */ }

    doc.save(`CBSE_Toppers_${result.subject}_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 animate-in fade-in duration-700 text-left overflow-y-auto">
      <div className="max-w-2xl w-full text-center mt-10 pb-20">
        <div className="bg-violet-600 rounded-[4rem] p-16 md:p-20 text-white shadow-3xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">{result.subject}</p>
          <div className="text-[8rem] md:text-[12rem] font-black leading-none tracking-tighter animate-in zoom-in duration-1000 delay-200">{result.score}</div>
          <p className="text-xl font-bold opacity-30 uppercase tracking-[0.3em]">SCORE / {result.total}</p>
        </div>

        {!analysis ? (
          <button
            onClick={getAnalysis}
            disabled={loading}
            className="w-full mb-6 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
            )}
            <span className="text-[12px] md:text-sm">{loading ? 'TopperAI is Analyzing...' : 'Deep AI Performance Analysis'}</span>
          </button>
        ) : (
          <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 text-left mb-10 animate-in slide-in-from-bottom-6 duration-700 relative overflow-hidden text-sm md:text-base">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-[4rem] -mr-16 -mt-16" />
            <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className="w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">AI Performance Review</h3>
                <p className="text-[10px] text-violet-500 font-bold uppercase tracking-[0.2em] mt-0.5">Custom Learning Path</p>
              </div>
            </div>

            <div className="relative z-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <LatexRenderer content={analysis} className="prose prose-slate max-w-none" />
            </div>

            <div className="mt-10 flex flex-col md:flex-row items-center gap-4">
              <button
                onClick={downloadQuizPDF}
                className="w-full md:w-auto px-8 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download PDF Report
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-topper-chat', { detail: { message: `Hey TopperAI, I scored ${result.score}/${result.total} in ${result.subject}. Can you analyze my performance more deeply and give me a career path? 💙` } }))}
                className="w-full md:flex-1 py-5 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Discuss with My Companion
              </button>
              <button onClick={onDone} className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-black active:scale-95 transition-all">Done</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mt-8 opacity-40">
          <div className="h-px w-8 bg-slate-400" />
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">TopperAI Result Analytics v2</p>
          <div className="h-px w-8 bg-slate-400" />
        </div>
      </div>
    </div>
  );
};

type View = 'auth' | 'dashboard' | 'exam' | 'result' | 'profile' | 'verify';

const VerificationPortal: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address');
    setStep('processing'); setError('');
    try {
      const { data, error: updateError } = await supabase
        .from('students')
        .update({ is_verified: true })
        .eq('email', email.trim())
        .select();
      if (updateError) throw updateError;
      if (!data || data.length === 0) { setStep('input'); return setError('Registration record not found'); }
      setStep('success');
    } catch (err) { setStep('input'); setError('Verification service unavailable'); }
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col items-center justify-center p-6 relative text-left">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-slate-50 text-center animate-in zoom-in duration-700">
        <img src={LOGO_URL} className="w-20 h-20 mx-auto rounded-3xl mb-8 shadow-lg" />
        {step === 'input' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-2">Identify Verification</h1>
            <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-8">Confirm your email to activate portal</p>
            <div className="space-y-4 text-left">
              <input type="email" placeholder="Enter your email" className="w-full p-5 rounded-3xl bg-slate-50 border border-transparent focus:border-violet-200 outline-none font-bold text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase py-4 px-6 rounded-2xl border border-red-100">{error}</div>}
              <button onClick={handleVerify} className="w-full py-5 bg-violet-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl">Apply Email Fix</button>
              <button onClick={onBack} className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-widest pt-2">Back to Login</button>
            </div>
          </div>
        )}
        {step === 'processing' && (
          <div className="py-12 space-y-8 animate-in fade-in duration-500">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Synchronizing...</h2>
          </div>
        )}
        {step === 'success' && (
          <div className="space-y-8 py-4 animate-in zoom-in duration-700">
            <div className="w-28 h-28 bg-green-500 text-white rounded-full mx-auto flex items-center justify-center shadow-2xl"><svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Email Confirmed!</h2>
            <button onClick={onBack} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest">Go to Portal</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ user: User, onBack: () => void, onUpdate: (u: User) => void }> = ({ user, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!editedName.trim()) return setError('Name cannot be empty');
    if (!editedGender) return setError('Please select your gender');

    setIsSaving(true);
    setError('');
    try {
      const updated = await updateStudentProfile(user.student_id, {
        name: editedName,
        gender: editedGender
      });
      if (updated) {
        onUpdate({
          ...user,
          name: updated.name,
          gender: updated.gender
        });
        setIsEditing(false);
      }
    } catch (e: any) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col items-center p-4 md:p-12 animate-in fade-in duration-500 text-left overflow-y-auto w-full">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-violet-600 font-black uppercase text-[10px] tracking-widest bg-violet-50 px-5 py-3 rounded-xl hover:bg-violet-600 hover:text-white transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </button>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-white border border-violet-100 px-5 py-3 rounded-xl hover:bg-violet-50 transition-all shadow-sm">
              Edit Profile
            </button>
          )}
        </div>

        {(!user.gender && !isEditing) && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] animate-bounce-slow">
            <h3 className="text-red-600 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              Profile Incomplete
            </h3>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4">Please set your gender and update your profile to proceed smoothly.</p>
            <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-red-200">Update Now</button>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-xl md:shadow-2xl overflow-hidden border border-slate-50 relative pb-10">
          <div className="bg-violet-600 p-8 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-4xl md:text-5xl font-black border-4 border-white/30 shadow-2xl">
                {user.name.charAt(0)}
              </div>
              <div className="text-center md:text-left">
                {isEditing ? (
                  <input
                    type="text"
                    className="bg-white/10 border-2 border-white/20 rounded-xl px-4 py-2 text-2xl md:text-3xl font-black uppercase tracking-tighter w-full focus:outline-none focus:border-white ring-0"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                ) : (
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-tight">{user.name}</h2>
                )}
                <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/20">Class {user.class}</span>
                  {user.stream && <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/10">{user.stream}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Gender</p>
              {isEditing ? (
                <div className="flex gap-2">
                  {['MALE', 'FEMALE', 'PREFER_NOT_SAY'].map(g => (
                    <button key={g} onClick={() => setEditedGender(g)} className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase transition-all ${editedGender === g ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                      {g.split('_')[0]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-black text-slate-800 uppercase text-[11px] tracking-widest">
                  {user.gender?.replace(/_/g, ' ') || 'None Set'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Student Identifier</p>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-base font-black text-slate-800 tracking-widest opacity-60 pointer-events-none">
                {user.student_id}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Email Address</p>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 opacity-60 pointer-events-none">{user.email || 'Not provided'}</div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-1">Date of Birth</p>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 opacity-60 pointer-events-none">{user.dob || 'Not provided'}</div>
            </div>
          </div>

          {isEditing && (
            <div className="px-8 md:px-14 pb-8 space-y-4">
              {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center py-3 bg-red-50 rounded-xl">{error}</p>}
              <div className="flex gap-4">
                <button onClick={() => { setIsEditing(false); setEditedName(user.name); setEditedGender(user.gender || ''); }} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-8 md:p-12 flex flex-col items-center gap-6 border-t border-slate-100 mt-10">
            <button
              onClick={() => { localStorage.removeItem('pe_cbt_session'); window.location.reload(); }}
              className="w-full max-w-xs py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out Account
            </button>
            <img src={LOGO_URL} className="w-12 h-12 grayscale opacity-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [examConfig, setExamConfig] = useState<{ subj: string, pid: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify') === 'true') {
      setView('verify');
      return;
    }

    const saved = localStorage.getItem('pe_cbt_session');
    if (saved) {
      try { setUser(JSON.parse(saved).user); setView('dashboard'); } catch (e) { localStorage.removeItem('pe_cbt_session'); }
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('pe_cbt_session', JSON.stringify({ user: u }));
    setView('dashboard');
  };

  const handleStartExam = (subj: string, pid: string) => {
    setExamConfig({ subj, pid });
    setView('exam');
  };

  const handleFinishExam = (res: QuizResult) => {
    setQuizResult(res);
    setView('result');
  };

  const handleDoneResult = () => {
    setView('dashboard');
    setQuizResult(null);
    setExamConfig(null);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('pe_cbt_session', JSON.stringify(updatedUser));
  };

  return (
    <div className="App selection:bg-violet-100 selection:text-violet-600">
      {view === 'auth' && <AuthScreen onLogin={(u) => { setUser(u); setView('dashboard'); localStorage.setItem('pe_cbt_session', JSON.stringify(u)); }} setView={setView} />}
      {view === 'verify' && <VerificationPortal onBack={() => setView('auth')} />}
      {view === 'dashboard' && user && (
        <Dashboard
          user={user}
          onStartExam={(subj, pid) => { setExamConfig({ subj, pid }); setView('exam'); }}
          setView={setView}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      )}
      {view === 'exam' && user && examConfig && (
        <QuizEngine
          user={user}
          subject={examConfig.subj}
          paperId={examConfig.pid}
          onFinish={(res) => { setQuizResult(res); setView('result'); }}
        />
      )}
      {view === 'result' && quizResult && (
        <ResultView result={quizResult} onDone={() => { setView('dashboard'); setQuizResult(null); setExamConfig(null); }} />
      )}
      {view === 'profile' && user && (
        <ProfileView
          user={user}
          onBack={() => setView('dashboard')}
          onUpdate={handleUpdateProfile}
        />
      )}

      <AIChatWidget
        user={user}
        currentView={view}
        selectedSubject={selectedSubject}
        onStartAIQuiz={(config) => {
          setExamConfig({ subj: config.subject, pid: 'AI_DYNAMIC' });
          setView('exam');
        }}
      />
    </div>
  );
};

export default App;
