// CBSE TOPPERS - Premium Education Platform
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, QuizResult, Question } from './types';
import { PAPER_1_QUESTIONS, CASE_STUDIES_P1, PAPER_2_QUESTIONS, CASE_STUDIES_P2, STREAM_SUBJECTS } from './constants';
import { verifyStudent, registerStudent, supabase, saveQuizResult, fetchStudentStats, updateStudentProfile, fetchMaintenanceStatus } from './services/supabase';
import { analyzeResult, generateAIQuiz, getMotivationalQuote } from './services/ai';
import AIChatWidget from './AIChatWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { getPyodide, runPythonDiagram } from './services/python';
import { hapticsImpactLight, hapticsImpactMedium } from './services/haptics';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { motion, AnimatePresence } from 'framer-motion';

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
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const codeValue = String(children).replace(/\n$/, '');

          const isVisualIntent = !inline && (
            codeValue.includes('v-diag') ||
            codeValue.includes('import matplotlib') ||
            codeValue.includes('plt.')
          );

          if (isVisualIntent) {
            const diagId = `diag-${Math.random().toString(36).substr(2, 9)}`;
            getPyodide().then(py => {
              if (py) runPythonDiagram(py, codeValue, diagId);
            });
            return (
              <div
                onClick={() => {
                  const img = document.getElementById(diagId) as HTMLImageElement;
                  if (img && img.src) window.dispatchEvent(new CustomEvent('topper-zoom', { detail: img.src }));
                }}
                className="my-4 bg-white rounded-2xl p-3 border border-slate-100 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-zoom-in group"
              >
                <img id={diagId} className="max-w-full max-h-full object-contain rounded-lg z-10" alt="TopperAI Visual Support" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                <p id={`${diagId}-err`} className="text-red-500 text-[8px] font-mono mt-1 absolute bottom-1" />
              </div>
            );
          }
          return inline ? (
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-violet-600" {...props}>{children}</code>
          ) : (
            <div className="relative my-4 group">
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{match ? match[1] : 'code'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-400 leading-relaxed custom-scrollbar"><code>{children}</code></pre>
              </div>
            </div>
          );
        }
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
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const codeValue = String(children).replace(/\n$/, '');

          const isVisualIntent = !inline && (
            codeValue.includes('v-diag') ||
            codeValue.includes('import matplotlib') ||
            codeValue.includes('plt.')
          );

          if (isVisualIntent) {
            const diagId = `diag-${Math.random().toString(36).substr(2, 9)}`;
            getPyodide().then(py => {
              if (py) runPythonDiagram(py, codeValue, diagId);
            });
            return (
              <div
                onClick={() => {
                  const img = document.getElementById(diagId) as HTMLImageElement;
                  if (img && img.src) window.dispatchEvent(new CustomEvent('topper-zoom', { detail: img.src }));
                }}
                className="my-3 bg-white rounded-xl p-2 border border-slate-100 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-zoom-in group"
              >
                <img id={diagId} className="max-w-full max-h-full object-contain rounded-lg z-10" alt="TopperAI Visual Support" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] z-0 group-[&:not(:has(img[src]))]:flex hidden">
                  <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[7px] font-black text-violet-600 uppercase tracking-widest">Visualizing...</span>
                </div>
                <p id={`${diagId}-err`} className="text-red-500 text-[7px] font-mono absolute bottom-0" />
              </div>
            );
          }
          return inline ? <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-violet-600 font-bold" {...props}>{children}</code> : <pre className="bg-slate-900 text-slate-400 p-4 rounded-xl text-[10px] overflow-x-auto my-4 font-mono"><code>{children}</code></pre>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Timer: 90 seconds (1.5 min) per MCQ question — e.g. 10 Qs = 15 min, 20 Qs = 30 min
const SECONDS_PER_QUESTION = 90;
// Logo used for PDF watermark — served from /public/favicon.png on the deployed site
const PDF_LOGO_URL = "/logo.png";

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
const LOGO_URL = "/logo.png";
const TG_CHANNEL = "https://t.me/CBSET0PPERS";
const TG_GROUP = "https://t.me/CBSET0PPER";
const TG_PHYSICS = "https://t.me/TusharPatelPHYSICSNEET";
const CONTACT_FOUNDER = "https://t.me/seniiiorr";
const CONTACT_OWNER = "https://t.me/tarun_kumar_in";
const CONTACT_CEO = "https://t.me/war4ver";
const EMAIL_FOUNDER = "luckychawla@zohomail.in";
const EMAIL_OWNER = "tarun.in@zohomail.in";
const EMAIL_CEO = "abhisekpani479@gmail.com";


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

const MaintenancePage: React.FC<{ data: any }> = ({ data }) => {
  const [showContacts, setShowContacts] = useState(false);
  const openingDate = data?.maintenance_opening_date ? new Date(data.maintenance_opening_date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-500 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="max-w-md w-full space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-violet-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-violet-200 animate-bounce cursor-default">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full border-4 border-white flex items-center justify-center shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Maintenance Mode</h1>
          <div className="h-1 w-20 bg-violet-600 mx-auto rounded-full" />
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">
            {data?.maintenance_message || "We're currently improving your experience. We'll be back online shortly!"}
          </p>
        </div>

        {openingDate && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[2rem] space-y-2">
            <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Expected Back By</p>
            <p className="text-lg font-black text-slate-800 dark:text-white">{openingDate}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href={TG_CHANNEL} target="_blank" className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-600 transition-all group flex flex-col items-center">
            <div className="w-10 h-10 bg-violet-100 dark:bg-slate-700 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
            </div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Official Updates</p>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 uppercase tracking-tight text-center">Join Channel</p>
          </a>
          <a href={TG_GROUP} target="_blank" className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-600 transition-all group flex flex-col items-center">
            <div className="w-10 h-10 bg-violet-100 dark:bg-slate-700 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
            </div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Community Hub</p>
            <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 uppercase tracking-tight text-center">Discussion Group</p>
          </a>
        </div>

        <button
          onClick={() => { localStorage.removeItem('pe_cbt_session'); window.location.reload(); }}
          className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
        >
          Sign Out & Return Home
        </button>
      </div>

      {/* Floating Telegram Icon for Maintenance Mode */}
      <button
        onClick={() => setShowContacts(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#229ED9] text-white rounded-2xl shadow-2xl shadow-blue-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in zoom-in slide-in-from-bottom-10 duration-700 z-[100] group"
      >
        <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" />
        </svg>
        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Contact</div>
      </button>

      {/* Contact Bottom Sheet */}
      {showContacts && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowContacts(false)} />
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 p-8 pt-10 animate-in slide-in-from-bottom-full duration-500 flex flex-col">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-8 shrink-0" />
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Technical Support</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect with the Founders</p>
            </div>
            <div className="space-y-4 mb-4">
              <a href={CONTACT_FOUNDER} target="_blank" className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-violet-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-xl">👑</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-0.5">Founder</p>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Lucky Chawla</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{EMAIL_FOUNDER}</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
              </a>
              <a href={CONTACT_OWNER} target="_blank" className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-violet-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-0.5">OWNER</p>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Tarun Kumar</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{EMAIL_OWNER}</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
              </a>
              <a href={CONTACT_CEO} target="_blank" className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-violet-500 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-0.5">CEO</p>
                    <p className="font-black text-slate-800 uppercase tracking-tight">Abhishek Pani</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">{EMAIL_CEO}</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
              </a>
            </div>
            <button onClick={() => setShowContacts(false)} className="w-full mt-6 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const SmoothInput: React.FC<{
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}> = React.memo(({ type = 'text', placeholder, value, onChange, className }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync if parent value changes externally
  useEffect(() => { setLocalValue(value); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalValue(v);
    onChange(v);
  };

  return (
    <input
      type={type}
      placeholder={placeholder}
      className={className || "w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100 transition-all"}
      value={localValue}
      onChange={handleChange}
    />
  );
});

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
  const [regCompetitions, setRegCompetitions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showLegal, setShowLegal] = useState<null | 'privacy' | 'terms'>(null);

  const handleLogin = async () => {
    if (!roll.trim() || !password.trim()) return setError('Required: Email/ID and Password');
    setIsVerifying(true); setError('');
    try {
      const student = await verifyStudent(roll, password);
      if (student) onLogin({ id: String(student.id), name: student.name, student_id: student.student_id, dob: student.dob, email: student.email, class: student.class, stream: student.stream, phone: student.phone, gender: student.gender, competitive_exams: student.competitive_exams });
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
        gender: regGender,
        competitiveExams: regCompetitions
      });
      if (student) {
        onLogin({ id: String(student.id), name: student.name, student_id: student.student_id, dob: student.dob, email: student.email, class: student.class, stream: student.stream, phone: student.phone, gender: student.gender, competitive_exams: student.competitive_exams });
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed. Try a different email.');
    } finally { setIsVerifying(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] p-6 relative overflow-hidden text-left transition-colors duration-500">
      {/* Dynamic Background Elements for Dark Mode */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>
      <div className="max-w-sm w-full text-center animate-in fade-in zoom-in duration-700">
        <img src={LOGO_URL} className="w-20 h-20 mx-auto rounded-[1.2rem] mb-4 shadow-lg border border-slate-50 dark:border-slate-800" />
        <h1 className="text-2xl font-black text-violet-600 mb-0.5 uppercase tracking-tighter">CBSE TOPPERS</h1>
        {!isRegistering ? (
          <div className="flex flex-col items-center">
            <div className="animate-pulse bg-red-600 text-white text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest mb-1">Live for 2026 EXAMS</div>
            <TypingPartnershipText />
            <div className="space-y-4 text-left w-full mt-2">
              <SmoothInput placeholder="Email or Student ID" value={roll} onChange={setRoll} />
              <SmoothInput type="password" placeholder="Password" value={password} onChange={setPassword} />
              {error && (
                <div className="space-y-3">
                  <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-center border border-red-100 dark:border-red-900/10">{error}</p>
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
                        className="w-full text-slate-400 font-black uppercase text-[9px] tracking-widest py-1 border border-slate-100 dark:border-slate-800 rounded-xl"
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
              <button
                onClick={() => setView('internship')}
                className="w-full mt-2 py-4 border-2 border-violet-100 dark:border-violet-900/30 rounded-2xl flex items-center justify-center gap-2 group hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all"
              >
                <span className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest">Apply for Internship</span>
                <span className="text-xs group-hover:translate-x-1 transition-transform">🚀</span>
              </button>
              <div className="mt-12 text-center">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">Made with ❤️ by Students</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left animate-in slide-in-from-right-4 duration-500">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${regStep >= s ? 'bg-violet-600' : 'bg-slate-100 dark:bg-slate-800'}`} />)}
            </div>
            {regStep === 1 && (
              <div className="space-y-3">
                <div className="px-1 text-center mb-2">
                  <h3 className="font-black text-[11px] uppercase text-slate-800 dark:text-slate-200 tracking-tight mb-1">Step 01: Community Access</h3>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Join our handles to proceed</p>
                </div>
                <div className="space-y-4">
                  <a href={TG_CHANNEL} target="_blank" className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-violet-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest group-hover:text-violet-600 transition-colors">Official Channel</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                  </a>
                  <a href={TG_GROUP} target="_blank" className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-violet-500 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-widest group-hover:text-violet-600 transition-colors">Discussion Group</span>
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
                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent dark:border-slate-800 cursor-pointer mt-4 active:scale-95 transition-transform">
                  <input type="checkbox" checked={hasJoinedTG} onChange={(e) => setHasJoinedTG(e.target.checked)} className="w-5 h-5 rounded-lg text-violet-600 focus:ring-violet-500" />
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">I have joined all community handles</span>
                </label>
                <button disabled={!hasJoinedTG} onClick={() => setRegStep(2)} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-violet-700 active:scale-95 disabled:opacity-50">Continue</button>
              </div>
            )}
            {regStep === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <div className="px-1 text-center mb-2">
                  <h3 className="font-black text-[11px] uppercase text-slate-800 dark:text-slate-200 tracking-tight mb-1">Step 02: Personal Details</h3>
                </div>
                <SmoothInput placeholder="Full Name (for certificate)" value={regName} onChange={setRegName} />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-4">Date of Birth</p>
                  <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold text-sm dark:text-white outline-none focus:ring-2 focus:ring-violet-100" value={regDOB} onChange={(e) => setRegDOB(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Xth', 'XIIth'].map(c => (
                    <button key={c} onClick={() => setRegClass(c)} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${regClass === c ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>{c}</button>
                  ))}
                </div>
                {regClass === 'XIIth' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in duration-300">
                    {['PCB', 'PCM', 'PCBM', 'Commerce', 'Humanities'].map(s => (
                      <button key={s} onClick={() => setRegStream(s)} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-tighter border-2 transition-all ${regStream === s ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{s}</button>
                    ))}
                  </div>
                )}
                <div className="space-y-1 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase ml-4">Target Competitive Exams</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['JEE', 'NEET', 'CUET', 'NDA'].map(exam => {
                      const isActive = regCompetitions.includes(exam);
                      return (
                        <button key={exam} onClick={() => setRegCompetitions(prev => isActive ? prev.filter(e => e !== exam) : [...prev, exam])} className={`py-3 rounded-xl font-black text-[8px] uppercase tracking-tighter border-2 transition-all ${isActive ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>{exam}</button>
                      );
                    })}
                  </div>
                </div>
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
        <button
          onClick={() => setView('help')}
          className="mt-10 text-[10px] font-black text-slate-300 dark:text-slate-600 hover:text-violet-500 uppercase tracking-widest transition-colors active:scale-95"
        >
          Need Help? Contact Support Center
        </button>
      </div>

      {
        showLegal && (
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
        )
      }
    </div >
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
        </div>
      </div>
    </div>
  );
};

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { name: 'Priya Sharma', xp: 2840 },
  { name: 'Arjun Mehta', xp: 2510 },
  { name: 'Sneha Patel', xp: 2200 },
  { name: 'Kavya Nair', xp: 1980 },
  { name: 'Rohan Verma', xp: 1750 },
];

// ─── Syllabus Tracker Section ──────────────────────────────────────────────────
const SyllabusTrackerSection: React.FC<{ user: User }> = ({ user }) => {
  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`syllabus_prog_v1_${user.student_id}`) || '{}'); }
    catch { return {}; }
  });

  const streamKey = user.stream && user.class === 'XIIth' ? user.stream : user.class === 'Xth' ? 'X' : (user.stream || 'PCM');
  const subjects = STREAM_SUBJECTS[streamKey] || STREAM_SUBJECTS['PCM'];

  const toggleSubject = (subj: string) => {
    const newProgress = { ...completed };
    const current = newProgress[subj] || 0;
    newProgress[subj] = current >= 100 ? 0 : current + 25; // Simple toggle for demo
    setCompleted(newProgress);
    localStorage.setItem(`syllabus_prog_v1_${user.student_id}`, JSON.stringify(newProgress));
  };

  return (
    <section className="mb-12 animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-100" />
        <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] flex items-center gap-2"><span>📂</span> {user.stream || user.class} Syllabus Tracker</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {subjects.map(subj => {
          const progress = completed[subj] || 0;
          return (
            <div key={subj} className="glass-card p-6 flex flex-col gap-4 group hover:border-violet-200 transition-all cursor-pointer" onClick={() => toggleSubject(subj)}>
              <div className="flex items-center justify-between">
                <p className="font-black text-slate-800 text-sm">{subj}</p>
                <span className="text-xl group-hover:scale-125 transition-transform">📚</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{progress}% Complete</span>
                <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Track Progress</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ─── Performance Analytics Dashboard ────────────────────────────────────────
const PerformanceDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [animRing, setAnimRing] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const history: QuizResult[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('topper_quiz_history') || '[]'); }
    catch { return []; }
  }, []);

  const stats = useMemo(() => {
    if (history.length === 0) return { accuracy: 78, strongest: 'Biology', weakest: 'Chemistry', xp: 540, rank: '#12' };
    const subjectMap: Record<string, { total: number; score: number }> = {};
    let totalScore = 0, totalQ = 0;
    history.forEach(r => {
      totalScore += r.score; totalQ += r.total;
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, score: 0 };
      subjectMap[r.subject].total += r.total;
      subjectMap[r.subject].score += r.score;
    });
    const accuracy = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
    const subjects = Object.entries(subjectMap).map(([name, d]) => ({ name, pct: Math.round((d.score / d.total) * 100) }));
    subjects.sort((a, b) => b.pct - a.pct);
    const xp = history.reduce((acc, r) => acc + Math.round((r.score / r.total) * 100) + 10, 0);
    return { accuracy, strongest: subjects[0]?.name || 'Biology', weakest: subjects[subjects.length - 1]?.name || 'Chemistry', xp, rank: '#' + Math.max(1, 50 - history.length) };
  }, [history]);

  const last7 = useMemo(() => {
    const recent = [...history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 7).reverse();
    if (recent.length === 0) return { labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5', 'Test 6', 'Test 7'], data: [45, 52, 60, 58, 67, 72, 81] };
    return { labels: recent.map((_, i) => `Test ${i + 1}`), data: recent.map(r => Math.round((r.score / r.total) * 100)) };
  }, [history]);

  const weakTopics = useMemo(() => {
    if (history.length === 0) return ['Genetics & Evolution (Chapter 6)', 'Chemical Kinetics (Unit III)', 'Electromagnetic Induction'];
    return [`Focus on ${stats.weakest} — your lowest scoring subject`, 'Practice 5 MCQs daily on weak chapters', 'Attempt one full AI mock test every 3 days'];
  }, [history, stats.weakest]);

  const circumference = 2 * Math.PI * 44;

  useEffect(() => { const t = setTimeout(() => setAnimRing(true), 300); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const ChartJS = (window as any).Chart;
    if (!ChartJS) return;
    if (chartInstance.current) { chartInstance.current.destroy(); }
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(124,58,237,0.18)');
    gradient.addColorStop(1, 'rgba(124,58,237,0.0)');
    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: last7.labels,
        datasets: [{ label: 'Score %', data: last7.data, borderColor: '#7C3AED', backgroundColor: gradient, borderWidth: 2.5, pointBackgroundColor: '#7C3AED', pointRadius: 5, pointHoverRadius: 8, tension: 0.45, fill: true }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e293b', titleColor: '#a855f7', bodyColor: '#fff', padding: 12, cornerRadius: 12, callbacks: { label: (c: any) => ` ${c.parsed.y}% accuracy` } }
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as any }, callback: (v: any) => v + '%' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as any } } }
        },
        animation: { duration: 1200, easing: 'easeInOutQuart' }
      }
    });
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [last7]);

  const strokeDash = `${(stats.accuracy / 100) * circumference} ${circumference}`;

  return (
    <section className="mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-100 dark:to-violet-900/30" />
        <h3 className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.3em] flex items-center gap-2"><span>📊</span> Your Performance Analytics</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-100 dark:to-violet-900/30" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Overall Accuracy */}
        <div className="glass-card p-5 flex flex-col items-center gap-2 hover:scale-[1.03] cursor-default">
          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Overall Accuracy</p>
          <svg width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ringGrad)" strokeWidth="8"
              strokeDasharray={animRing ? strokeDash : `0 ${circumference}`}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.2s ease' }} />
            <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#A855F7" />
            </linearGradient></defs>
            <text x="50" y="50" textAnchor="middle" dy="6" fontSize="18" fontWeight="900" fill="#7C3AED">{stats.accuracy}%</text>
          </svg>
        </div>
        {/* Strongest */}
        <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03] cursor-default">
          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Strongest</p>
          <div className="text-4xl">🏆</div>
          <p className="font-black text-slate-800 dark:text-slate-200 text-sm text-center leading-tight">{stats.strongest}</p>
          <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">Top Performer</span>
        </div>
        {/* Weakest */}
        <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03] cursor-default">
          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Needs Work</p>
          <div className="text-4xl">⚡</div>
          <p className="font-black text-slate-800 dark:text-slate-200 text-sm text-center leading-tight">{stats.weakest}</p>
          <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">Focus Here</span>
        </div>
        {/* Rank & XP */}
        <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03] cursor-default" style={{ background: theme === 'dark' ? 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.12))' : 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.08))' }}>
          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Rank & XP</p>
          <p className="text-4xl font-black text-violet-600">{stats.rank}</p>
          <div className="bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-violet-200">{stats.xp} XP</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="glass-card p-6 md:p-8 mb-5">
        <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-500 rounded-full inline-block" />
          Last 7 Test Performance
        </p>
        <canvas ref={chartRef} height={120} style={{ filter: theme === 'dark' ? 'invert(0.1) brightness(1.2)' : 'none' }} />
      </div>

      {/* Smart Revision CTA */}
      <button onClick={() => setShowModal(true)}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-200/60 hover:shadow-violet-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 btn-glow">
        <span>🧠</span> Generate Smart Revision Plan
      </button>

      {/* Revision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Smart Revision Plan</h3>
                <p className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest mt-1">AI-Generated · Personalized for {user.name.split(' ')[0]}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-all text-slate-500 font-black">✕</button>
            </div>
            <div className="space-y-3 mb-6 font-left text-left">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">⚡ Weak Topics to Revise</p>
                <ul className="space-y-1.5">
                  {weakTopics.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                <p className="text-[9px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-2">📅 Suggested Practice</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Complete <span className="text-violet-600 dark:text-violet-400 font-black">3 targeted tests</span> on weak topics this week. Aim for <span className="text-violet-600 dark:text-violet-400 font-black">20 min/day</span> of focused revision.</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                <p className="text-[9px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest mb-2">🚀 Predicted Improvement</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Following this plan could improve your accuracy by <span className="text-green-600 dark:text-green-400 font-black">+12–18%</span> within 2 weeks.</p>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Got It, Let's Go! 🚀</button>
          </div>
        </div>
      )}
    </section>
  );
};

// ─── Gamification Section ─────────────────────────────────────────────────────
const GamificationSection: React.FC<{ user: User; xp: number }> = ({ user, xp }) => {
  const [barFilled, setBarFilled] = useState(false);
  useEffect(() => { const t = setTimeout(() => setBarFilled(true), 600); return () => clearTimeout(t); }, []);

  const streak = useMemo(() => {
    try {
      const h: QuizResult[] = JSON.parse(localStorage.getItem('topper_quiz_history') || '[]');
      if (h.length === 0) return 5;
      const days = new Set(h.map(r => new Date(r.timestamp).toDateString()));
      return days.size;
    } catch { return 5; }
  }, []);

  const xpGoal = 1000;
  const pct = Math.min(100, Math.round((xp / xpGoal) * 100));
  const badges = [
    { name: 'Bronze', min: 0, max: 200, icon: '🥉', bg: 'from-amber-700 to-amber-500' },
    { name: 'Silver', min: 200, max: 500, icon: '🥈', bg: 'from-slate-400 to-slate-300' },
    { name: 'Gold', min: 500, max: 1000, icon: '🥇', bg: 'from-amber-400 to-yellow-300' },
    { name: 'Diamond', min: 1000, max: Infinity, icon: '💎', bg: 'from-sky-400 to-violet-400' },
  ];
  const currentBadge = badges.findIndex(b => xp >= b.min && xp < b.max);

  return (
    <section className="mb-12 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-100 dark:to-violet-900/30" />
        <h3 className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.3em] flex items-center gap-2"><span>🎮</span> Level Up Your Preparation</h3>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-100 dark:to-violet-900/30" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {/* Left: Streak + XP + Badges */}
        <div className="space-y-4">
          <div className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02]">
            <div className="text-5xl animate-flameBounce">🔥</div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{streak} Day Streak</p>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Keep going, {user.name.split(' ')[0]}!</p>
            </div>
          </div>
          <div className="glass-card p-6 hover:scale-[1.02]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">🎯 XP Progress</p>
              <p className="text-sm font-black text-violet-600 dark:text-violet-400">{xp} / {xpGoal} XP</p>
            </div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-1000 ease-out shadow-sm shadow-violet-300 dark:shadow-violet-900/50"
                style={{ width: barFilled ? `${pct}%` : '0%' }} />
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-widest">{pct}% to next level</p>
          </div>
          <div className="glass-card p-6 hover:scale-[1.02]">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-4">🏅 Badge Path</p>
            <div className="grid grid-cols-4 gap-2">
              {badges.map((b, i) => (
                <div key={b.name} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${i === currentBadge ? `bg-gradient-to-br ${b.bg} shadow-lg scale-110 ring-2 ring-violet-200 dark:ring-violet-900` : 'bg-slate-50 dark:bg-slate-800 opacity-50'
                  }`}>
                  <span className="text-2xl">{b.icon}</span>
                  <p className={`text-[8px] font-black uppercase tracking-tight ${i === currentBadge ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{b.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Leaderboard */}
        <div className="glass-card p-6 hover:scale-[1.02] flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">🏆 Top Performers</p>
            <span className="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-violet-100 dark:border-violet-900/30">Leaderboard</span>
          </div>
          <div className="space-y-2.5 flex-1">
            {MOCK_LEADERBOARD.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01] ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30' : i === 1 ? 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800'
                }`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 dark:bg-slate-600 text-white dark:text-slate-300' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}</div>
                <p className="font-black text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">{s.name}</p>
                <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-lg border border-violet-100 dark:border-violet-900/30">{s.xp} XP</span>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full py-3 border-2 border-violet-100 text-violet-600 font-black uppercase text-[9px] tracking-widest rounded-2xl hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all active:scale-95">
            View Full Leaderboard →
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── Stats Panel (full-screen, opened by My Stats button) ────────────────────────
type StatsData = Awaited<ReturnType<typeof import('./services/supabase').fetchStudentStats>>;

const StatsPanel: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [stats, setStats] = useState<StatsData | null | 'loading'>('loading');
  const [showModal, setShowModal] = useState(false);
  const [animRing, setAnimRing] = useState(false);
  const [barFilled, setBarFilled] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    fetchStudentStats(user.student_id).then(data => {
      setStats(data);
      if (data) {
        setTimeout(() => { setAnimRing(true); setBarFilled(true); }, 400);
      }
    });
  }, [user.student_id]);

  useEffect(() => {
    if (!chartRef.current || !stats || stats === 'loading') return;
    const ChartJS = (window as any).Chart;
    if (!ChartJS) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(124,58,237,0.18)');
    gradient.addColorStop(1, 'rgba(124,58,237,0.0)');
    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: stats.chartLabels,
        datasets: [{ label: 'Score %', data: stats.chartData, borderColor: '#7C3AED', backgroundColor: gradient, borderWidth: 2.5, pointBackgroundColor: '#7C3AED', pointRadius: 5, pointHoverRadius: 8, tension: 0.45, fill: true }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1e293b', titleColor: '#a855f7', bodyColor: '#fff', padding: 12, cornerRadius: 12, callbacks: { label: (c: any) => ` ${c.parsed.y}% accuracy` } }
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as any }, callback: (v: any) => v + '%' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as any } } }
        },
        animation: { duration: 1200, easing: 'easeInOutQuart' }
      }
    });
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [stats]);

  const xpGoal = 1000;
  const badges = [
    { name: 'Bronze', min: 0, max: 200, icon: '🥉', bg: 'from-amber-700 to-amber-500' },
    { name: 'Silver', min: 200, max: 500, icon: '🥈', bg: 'from-slate-400 to-slate-300' },
    { name: 'Gold', min: 500, max: 1000, icon: '🥇', bg: 'from-amber-400 to-yellow-300' },
    { name: 'Diamond', min: 1000, max: Infinity, icon: '💎', bg: 'from-sky-400 to-violet-400' },
  ];

  return (
    <div className="fixed inset-0 z-[600] bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-500 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b dark:border-slate-800 shadow-sm px-6 md:px-12 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 text-left">
          <img src={LOGO_URL} className="w-9 h-9 rounded-xl" />
          <div>
            <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tighter">My Analytics</h2>
            <p className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest">{user.name.split(' ')[0]}'s Performance</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-500 dark:text-slate-400 transition-all active:scale-95">✕</button>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Loading */}
        {stats === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px]">Loading your real stats...</p>
          </div>
        )}

        {/* No tests yet */}
        {stats === null && (
          <div className="glass-card p-12 text-center animate-fadeInUp">
            <div className="text-7xl mb-6">👋</div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3">No Tests Completed Yet!</h3>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm max-w-md mx-auto">Complete your first mock test or AI quiz to see your real performance analytics here.</p>
            <button onClick={onClose} className="mt-8 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">Start a Test Now →</button>
          </div>
        )}

        {/* Real stats */}
        {stats && stats !== 'loading' && (
          <div className="space-y-6 animate-fadeInUp">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 flex flex-col items-center gap-2 hover:scale-[1.03]">
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Overall Accuracy</p>
                <svg width="90" height="90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="url(#rg2)" strokeWidth="8"
                    strokeDasharray={animRing ? `${(stats.accuracy / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}` : `0 ${2 * Math.PI * 44}`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1.2s ease' }} />
                  <defs><linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#A855F7" />
                  </linearGradient></defs>
                  <text x="50" y="50" textAnchor="middle" dy="6" fontSize="17" fontWeight="900" fill="currentColor" className="text-violet-600 dark:text-violet-400">{stats.accuracy}%</text>
                </svg>
              </div>
              <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03]">
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Strongest</p>
                <div className="text-4xl">🏆</div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm text-center leading-tight">{stats.strongest}</p>
                <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/10">Top Performer</span>
              </div>
              <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03]">
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Needs Work</p>
                <div className="text-4xl">⚡</div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-sm text-center leading-tight">{stats.weakest}</p>
                <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 text-[8px] font-black uppercase px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/10">Focus Here</span>
              </div>
              <div className="glass-card p-5 flex flex-col items-center justify-center gap-2 hover:scale-[1.03]" style={{ background: theme === 'dark' ? 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.12))' : 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.08))' }}>
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Rank & XP</p>
                <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{stats.rank}</p>
                <div className="bg-gradient-to-r from-violet-600 to-purple-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-violet-200 dark:shadow-none">{stats.xp} XP</div>
              </div>
            </div>

            {/* Line Chart */}
            {stats.chartData.length > 0 && (
              <div className="glass-card p-6 md:p-8">
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full inline-block" />
                  Last {stats.chartData.length} Test Performance
                </p>
                <canvas ref={chartRef} height={110} style={{ filter: theme === 'dark' ? 'invert(0.1) brightness(1.2)' : 'none' }} />
              </div>
            )}

            {/* Gamification Row */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {/* Streak */}
                <div className="glass-card p-6 flex items-center gap-5 hover:scale-[1.02]">
                  <div className="text-5xl animate-flameBounce">🔥</div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{stats.streak} Day Streak</p>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Keep going, {user.name.split(' ')[0]}!</p>
                  </div>
                </div>
                {/* XP Bar */}
                <div className="glass-card p-6 hover:scale-[1.02]">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">🎯 XP Progress</p>
                    <p className="text-sm font-black text-violet-600 dark:text-violet-400">{stats.xp} / {xpGoal} XP</p>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-1000 ease-out shadow-sm shadow-violet-400 dark:shadow-none"
                      style={{ width: barFilled ? `${Math.min(100, Math.round((stats.xp / xpGoal) * 100))}%` : '0%' }} />
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-2 uppercase tracking-widest">{Math.min(100, Math.round((stats.xp / xpGoal) * 100))}% to next level</p>
                </div>
                {/* Badges */}
                <div className="glass-card p-6 hover:scale-[1.02]">
                  <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-4">🏅 Badge Path</p>
                  <div className="grid grid-cols-4 gap-2">
                    {badges.map((b, i) => {
                      const active = stats.xp >= b.min && stats.xp < b.max;
                      return (
                        <div key={b.name} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${active ? `bg-gradient-to-br ${b.bg} shadow-lg scale-110 ring-2 ring-violet-200 dark:ring-violet-900` : 'bg-slate-50 dark:bg-slate-800 opacity-40'}`}>
                          <span className="text-2xl">{b.icon}</span>
                          <p className={`text-[8px] font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{b.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leaderboard — real data from Supabase */}
              <div className="glass-card p-6 hover:scale-[1.02] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">🏆 Real Leaderboard</p>
                  <span className="bg-green-50 text-green-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-green-100">Live Data</span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {stats.leaderboard.length === 0 && <p className="text-slate-400 text-sm font-bold text-center py-8">No leaderboard data yet</p>}
                  {stats.leaderboard.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${s.name === user.name ? 'bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-200 dark:border-violet-800' : i === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 dark:bg-slate-600 text-white dark:text-slate-300' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                      </div>
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100 flex-1 truncate">{s.name}{s.name === user.name ? <span className="text-[8px] text-violet-500 dark:text-violet-400 ml-1">(You)</span> : ''}</p>
                      <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/40 px-2 py-0.5 rounded-lg border border-violet-100 dark:border-violet-900/40">{s.xp} XP</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-4 text-center uppercase tracking-widest">Total tests: {stats.testsCount}</p>
              </div>
            </div>

            {/* Smart Revision CTA */}
            <button onClick={() => setShowModal(true)}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-200/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 btn-glow">
              <span>🧠</span> Generate Smart Revision Plan
            </button>
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {showModal && stats && stats !== 'loading' && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Smart Revision Plan</h3>
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mt-1">AI-Generated · Real Data</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-slate-500 font-black">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">⚡ Focus Subject</p>
                <p className="font-black text-slate-800">{stats.weakest} — your lowest scoring subject</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2">📅 Suggested Practice</p>
                <p className="text-sm font-bold text-slate-700">Complete <span className="text-violet-600 font-black">3 targeted tests</span> on {stats.weakest} this week. 20 min/day focused revision.</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest mb-2">🚀 Predicted Improvement</p>
                <p className="text-sm font-bold text-slate-700">With targeted practice, accuracy could improve <span className="text-green-600 font-black">+12–18%</span> in 2 weeks.</p>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Got It, Let's Go! 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
};

const LEGAL_DATA: Record<string, { title: string, content: { h: string, p: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    content: [
      { h: "1. Data Collection", p: "We collect basic information like your name, email, roll number, and date of birth to provide a personalized assessment experience and generate valid certificates." },
      { h: "2. Usage of Information", p: "Your data is used solely for identifying you within the CBSE TOPPERS portal, tracking your mock test progress, and providing support via Telegram." },
      { h: "3. Data Security", p: "We implement strict security measures to protect your personal details. We do not sell or share your personal data with third-party advertisers." }
    ]
  },
  terms: {
    title: "Terms & Conditions",
    content: [
      { h: "1. Platform Usage", p: "CBSE TOPPERS is an educational tool for mock assessments. Users are expected to use the platform for legitimate preparation purposes only." },
      { h: "2. Account Integrity", p: "Each 8-digit Roll ID is unique to a user. Sharing accounts or attempting to bypass assessment limits (5 attempts per paper) is strictly prohibited." },
      { h: "3. Intellectual Property", p: "All questions, narratives, and branding are the property of CBSE TOPPERS and its partners. Unauthorized reproduction is forbidden." }
    ]
  },
  refund: {
    title: "Refund Policy",
    content: [
      { h: "1. Digital Content", p: "As CBSE TOPPERS provides digital access to practice papers and AI tools, we generally do not offer refunds once access has been granted." },
      { h: "2. Technical Issues", p: "If you face payment double-deductions or technical failures preventing access, please contactLucky Chawla on Telegram for a swift resolution." }
    ]
  },
  honor: {
    title: "Honor Code",
    content: [
      { h: "1. Personal Effort", p: "Students must take mock exams using their own knowledge without external help to get a real picture of their preparation level." },
      { h: "2. Ethics", p: "Using unfair means or leaking papers inside the portal is against our mission of student empowerment." }
    ]
  }
};

const Dashboard: React.FC<{ user: User, onStartExam: (s: string, p: string) => void, setView: (v: View) => void, selectedSubject: string | null, setSelectedSubject: (s: string | null) => void, theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }> = ({ user, onStartExam, setView, selectedSubject, setSelectedSubject, theme, setTheme }) => {
  const [showStats, setShowStats] = useState(false);
  const [showTgMenu, setShowTgMenu] = useState(false);
  const [showLegalSide, setShowLegalSide] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenStats = () => setShowStats(true);
    window.addEventListener('open-stats', handleOpenStats);
    return () => window.removeEventListener('open-stats', handleOpenStats);
  }, []);

  useEffect(() => {
    (window as any).isStatsOpen = showStats;
  }, [showStats]);

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
    <button key={subj} onClick={() => setSelectedSubject(subj)} className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-2xl transition-all text-center flex flex-col items-center gap-4 group animate-in slide-in-from-bottom-4 relative overflow-hidden">
      {isCore && <div className="absolute top-0 right-0 px-3 py-1 bg-violet-600 text-[8px] font-black text-white uppercase rounded-bl-xl tracking-widest z-10">Core</div>}
      <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-violet-50 dark:bg-slate-700/50 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      </div>
      <span className="text-[11px] md:text-[13px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-tight leading-tight">{subj}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] pb-20 relative text-left transition-colors duration-500">
      <header className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b dark:border-slate-800 px-6 md:px-12 py-4 md:py-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3 md:gap-4">
          <img src={LOGO_URL} className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl shadow-sm" />
          <div className="text-left">
            <h2 className="text-[12px] md:text-lg font-black uppercase leading-tight text-slate-800 dark:text-white tracking-tighter">CBSE TOPPERS</h2>
            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
              <span className="text-violet-600 font-black text-[9px] md:text-[12px] uppercase">{user.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* My Stats Button */}
          <button onClick={() => setShowStats(true)} className="bg-violet-50 px-3 py-2 md:px-4 rounded-xl text-violet-600 hover:bg-violet-600 hover:text-white border border-violet-100 transition-all active:scale-95 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="hidden md:inline">My Stats</span>
          </button>
          <button
            onClick={() => { hapticsImpactLight(); setTheme(t => t === 'light' ? 'dark' : 'light'); }}
            className="bg-slate-50 dark:bg-slate-800 p-2 md:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-violet-600 hover:text-white transition-all active:scale-95"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.364 17.636l-.707.707M17.636 17.636l-.707-.707M6.364 6.364l-.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </button>
          <button onClick={() => setView('profile')} className="bg-violet-50 dark:bg-slate-800 p-1 rounded-xl text-violet-600 dark:text-slate-300 hover:bg-violet-600 hover:text-white border border-violet-100 dark:border-slate-700 transition-all active:scale-95 overflow-hidden w-9 h-9 md:w-11 md:h-11 flex items-center justify-center">
            {user.gender === 'MALE' ? (
              <img src="/male_avtar.png" className="w-full h-full object-cover rounded-lg" alt="Profile" />
            ) : user.gender === 'FEMALE' ? (
              <img src="/female_avtar.png" className="w-full h-full object-cover rounded-lg" alt="Profile" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )}
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
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-topper-chat', { detail: { message: `Hey TopperAI, I'm a Class ${user.class}${user.stream ? ' ' + user.stream : ''} student. Can you analyze my syllabus and create a personalized 30-day preparation plan? 📅` } }))}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3"
                >
                  <span className="text-lg">🗓️</span> AI Syllabus Planner
                </button>
              </div>
            </div>

            <SyllabusTrackerSection user={user} />

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

            {/* end of subject sections — no analytics on homepage */}
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

                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight max-w-4xl">No Quizzes Available Right Now</h4>
                  <p className="text-xs md:text-base font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-3xl">
                    Stay updated, we will add more quizzes soon. Meanwhile you can create a <span className="text-violet-600">custom AI test</span> by chatting with our AI mentor below.
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

      {/* My Stats full-screen panel */}
      {showStats && <StatsPanel user={user} onClose={() => setShowStats(false)} />}

      {/* ── Minimalist Light Footer ── */}
      <footer className="mt-20 pb-12 flex flex-col items-center gap-4">

        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">© 2026 CBSE TOPPERS · Premium Education</p>
      </footer>

      {/* Telegram Bottom Sheet Support */}
      {showTgMenu && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowTgMenu(false)}
          />
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 p-8 pb-10 animate-in slide-in-from-bottom-full duration-500">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-8" />

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Support Center</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Connect with the Founders</p>
            </div>

            <div className="space-y-4">
              <a href={CONTACT_FOUNDER} target="_blank" onClick={() => setShowTgMenu(false)} className="flex items-center gap-5 p-6 bg-violet-50/50 dark:bg-slate-800/50 rounded-[2rem] group border-2 border-transparent hover:border-indigo-200 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 leading-none flex items-center gap-2">
                    Lucky Chawla
                    <span className="text-[9px] w-5 h-5 flex items-center justify-center bg-violet-600 text-white rounded-full shadow-sm">F</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{EMAIL_FOUNDER}</p>
                </div>
              </a>

              <a href={CONTACT_OWNER} target="_blank" onClick={() => setShowTgMenu(false)} className="flex items-center gap-5 p-6 bg-sky-50/50 dark:bg-slate-800/50 rounded-[2rem] group border-2 border-transparent hover:border-sky-200 dark:hover:border-sky-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <div className="w-16 h-16 bg-[#0088cc] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 leading-none flex items-center gap-2">
                    Tarun Kumar
                    <span className="text-[9px] w-5 h-5 flex items-center justify-center bg-sky-500 text-white rounded-full shadow-sm">O</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{EMAIL_OWNER}</p>
                </div>
              </a>
              <a href={CONTACT_CEO} target="_blank" onClick={() => setShowTgMenu(false)} className="flex items-center gap-5 p-6 bg-violet-50/50 dark:bg-slate-800/50 rounded-[2rem] group border-2 border-transparent hover:border-indigo-200 dark:hover:border-violet-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <div className="w-16 h-16 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.76-3.35 3.69-1.53 4.45-1.8 4.95-1.81.11 0 .36.03.52.16.13.11.17.26.18.37.01.07.01.14 0 .2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 leading-none flex items-center gap-2">
                    Abhishek Pani
                    <span className="text-[9px] w-5 h-5 flex items-center justify-center bg-violet-600 text-white rounded-full shadow-sm">C</span>
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-2">{EMAIL_CEO}</p>
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
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-10" />

            <div className="text-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{LEGAL_DATA[showLegalSide].title}</h3>
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-[0.3em] mt-2">Compliance & Security</p>
            </div>

            <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar text-left font-left">
              {LEGAL_DATA[showLegalSide].content.map((item, idx) => (
                <div key={idx} className="space-y-2 text-left">
                  <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">{item.h}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.p}</p>
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-12 rounded-[3rem] shadow-2xl border border-violet-100 dark:border-slate-700">
          <div className="w-20 h-20 bg-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-violet-200 dark:shadow-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Quiz Data Missing</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 mb-8 font-bold text-sm uppercase tracking-widest">TopperAI couldn't find this quiz. Try creating one in the chat!</p>
          <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 dark:bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col md:flex-row overflow-hidden font-sans text-left transition-colors duration-500">
      {/* Sidebar - Question Navigation */}
      <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col h-auto md:h-screen sticky top-0 md:relative z-20 transition-all duration-500">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-100 dark:shadow-none">
              <img src={LOGO_URL} className="w-6 h-6 rounded" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI Mock Test</h1>
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest leading-none">{subject}</p>
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
                className={`h-10 md:h-12 rounded-xl text-[11px] font-black transition-all border-2 flex items-center justify-center ${currentIdx === i ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-100 dark:shadow-none scale-105' : answers[i] !== null ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 space-y-3">
          <button
            onClick={downloadPaperPDF}
            className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download Paper PDF
          </button>
          <button onClick={handleFinish} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-black active:scale-95 transition-all">Submit Attempt</button>
        </div>
      </aside>

      {/* Main Content - Question Area */}
      <main className="flex-1 flex flex-col h-auto md:h-screen relative bg-white md:bg-slate-50 dark:bg-[#0f172a] overflow-y-auto">
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 flex items-center justify-center">
          <div className="w-full bg-white dark:bg-slate-900 md:rounded-[3.5rem] md:shadow-3xl md:border md:border-slate-50 dark:md:border-slate-800 p-8 md:p-16 animate-in slide-in-from-right-10 duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-50 dark:bg-violet-900/20 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />

            <div className="relative z-10 text-left">
              <div className="flex items-center gap-4 mb-10">
                <span className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-violet-200 dark:border-violet-900/40">Q{currentIdx + 1}</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
              </div>

              <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-[1.35] tracking-tight mb-12 text-left">
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
                    className={`group w-full p-6 md:p-8 rounded-3xl text-left transition-all border-2 flex items-center gap-6 relative overflow-hidden ${answers[currentIdx] === i ? 'bg-violet-600 border-violet-600 text-white shadow-xl translate-x-3' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-violet-100 dark:hover:border-violet-900 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-[0.98]'}`}
                  >
                    <span className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black transition-all ${answers[currentIdx] === i ? 'bg-white text-violet-600 shadow-md' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 border group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600 dark:group-hover:text-violet-400'}`}>{String.fromCharCode(65 + i)}</span>
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

        <footer className="p-6 md:p-12 bg-white dark:bg-slate-900 md:bg-transparent flex justify-between gap-6 w-full max-w-4xl mx-auto items-center">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(c => c - 1)} className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-violet-200 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all disabled:opacity-20 active:scale-95">Previous</button>

          <div className="hidden md:flex gap-2">
            {[...Array(Math.min(questions.length, 5))].map((_, i) => (
              <div key={i} className={`h-1.5 w-4 rounded-full transition-all ${currentIdx === i ? 'bg-violet-600 w-8' : 'bg-slate-200 dark:bg-slate-700'}`} />
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

  useEffect(() => {
    getAnalysis();
  }, []);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500 flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-700 text-left overflow-y-auto">
      <div className="max-w-4xl w-full mt-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Main Score Card */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">{result.subject}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[7rem] md:text-[9rem] font-black leading-none tracking-tighter animate-in zoom-in duration-1000 delay-200">{result.score}</span>
              <span className="text-2xl md:text-3xl font-bold opacity-40">/ {result.total}</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] mt-4 text-violet-100">Mock Test Result</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">⏱️</span>
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Time Taken</p>
              <p className="font-black text-xl text-slate-800 dark:text-white">{formatTime(result.timeSpent || 0)}</p>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">🎯</span>
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Accuracy</p>
              <p className="font-black text-xl text-slate-800 dark:text-white">{Math.round((result.score / result.total) * 100)}%</p>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center opacity-50">
              <span className="text-3xl mb-2">📈</span>
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">XP Earned</p>
              <p className="font-black text-xl text-slate-800 dark:text-white">+{Math.round((result.score / result.total) * 100) + 10}</p>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-2">🏅</span>
              <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-1">Rank</p>
              <p className="font-black text-xl text-slate-800 dark:text-white">#42</p>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="w-full">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 p-12 md:p-20 rounded-[3rem] shadow-xl border border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-6 animate-pulse">
              <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center shadow-lg animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyzing your performance...</h3>
                <p className="text-[10px] text-violet-500 dark:text-violet-400 font-bold uppercase tracking-[0.2em] mt-2">TopperAI is deep-thinking now</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-50 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
              <div className="bg-slate-900 dark:bg-slate-950 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">TopperAI Analysis</h3>
                    <p className="text-[10px] text-violet-400 font-black uppercase tracking-[0.3em] mt-2">Personalized for JEE/NEET/Boards</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-left">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Strategy Live</span>
                </div>
              </div>

              <div className="p-8 md:p-14">
                <div className="prose prose-slate max-w-none">
                  <LatexRenderer content={analysis} />
                </div>

                <div className="mt-14 pt-10 border-t border-slate-50 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={downloadQuizPDF}
                    className="flex-1 px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white dark:hover:bg-slate-700 hover:border-violet-100 dark:hover:border-violet-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-topper-chat', { detail: { message: `Hey TopperAI, I just completed my ${result.subject} test with ${result.score}/${result.total}. Let's discuss my 1-to-1 strategy for JEE/NEET. 💙` } }))}
                    className="flex-1 px-6 py-5 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Discuss Analysis
                  </button>
                  <button onClick={onDone} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black active:scale-95 transition-all">Back to Home</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-12 opacity-30 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] dark:text-slate-400">TopperAI Engine v4.0 · Neural Intelligence</p>
        </div>
      </div>
    </div>
  );
};



type View = 'auth' | 'dashboard' | 'exam' | 'result' | 'profile' | 'verify' | 'store' | 'internship' | 'help';

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
    <div className="min-h-screen bg-[#fcfaff] dark:bg-[#0f172a] transition-colors duration-500 flex flex-col items-center justify-center p-6 relative text-left">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-14 border border-slate-50 dark:border-slate-800 text-center animate-in zoom-in duration-700">
        <img src={LOGO_URL} className="w-20 h-20 mx-auto rounded-3xl mb-8 shadow-lg dark:shadow-none" />
        {step === 'input' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight mb-2 text-center">Identify Verification</h1>
            <p className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.3em] mb-8 text-center">Confirm your email to activate portal</p>
            <div className="space-y-4 text-left">
              <input type="email" placeholder="Enter your email" className="w-full p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-violet-200 dark:focus:border-violet-600 outline-none font-bold text-sm dark:text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-[10px] font-black uppercase py-4 px-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">{error}</div>}
              <button onClick={handleVerify} className="w-full py-5 bg-violet-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl">Apply Email Fix</button>
              <button onClick={onBack} className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-widest pt-2">Back to Login</button>
            </div>
          </div>
        )}
        {step === 'processing' && (
          <div className="py-12 space-y-8 animate-in fade-in duration-500 text-center">
            <div className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 border-t-violet-600 rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase">Synchronizing...</h2>
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

const ProfileView: React.FC<{ user: User, setView: (v: View) => void, onBack: () => void, onUpdate: (u: User) => void }> = ({ user, setView, onBack, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedGender, setEditedGender] = useState(user.gender || '');
  const [editedClass, setEditedClass] = useState(user.class);
  const [editedStream, setEditedStream] = useState(user.stream || '');
  const [editedDOB, setEditedDOB] = useState(user.dob || '');
  const [editedExams, setEditedExams] = useState<string[]>(user.competitive_exams || []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showLegalSide, setShowLegalSide] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editedName.trim()) return setError('Name cannot be empty');
    if (!editedGender) return setError('Please select your gender');
    if (!editedClass) return setError('Class is required');
    if (editedClass === 'XIIth' && !editedStream) return setError('Stream is required for Class XII');

    setIsSaving(true);
    setError('');
    try {
      const updated = await updateStudentProfile(user.id, {
        name: editedName,
        gender: editedGender as any,
        class: editedClass,
        stream: editedClass === 'XIIth' ? (editedStream || null) : null,
        dob: editedDOB,
        competitive_exams: editedExams
      });
      if (updated) {
        onUpdate({
          ...user,
          name: updated.name,
          gender: updated.gender,
          class: updated.class,
          stream: updated.stream,
          dob: updated.dob,
          competitive_exams: updated.competitive_exams
        });
        setIsEditing(false);
      }
    } catch (e: any) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExam = (exam: string) => {
    setEditedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center animate-in fade-in duration-500 text-left overflow-y-auto w-full pb-32">
        {/* Mobile-Native App Bar */}
        <div className="w-full sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-900 active:scale-90 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">My Profile</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className={`text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'text-violet-600' : 'text-slate-400'}`}
          >
            {isSaving ? '...' : isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="w-full max-w-lg">
          {/* Header Hero Section */}
          <div className="relative pt-10 pb-16 px-6 flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600 to-indigo-700 h-40 -z-10" />
            <div className="relative group">
              <div className="w-28 h-28 bg-white p-1 rounded-[2.5rem] shadow-2xl transition-transform group-hover:scale-105 overflow-hidden">
                <div className="w-full h-full bg-violet-100 rounded-[2.2rem] flex items-center justify-center text-4xl font-black text-violet-600 border-2 border-violet-50 overflow-hidden">
                  {user.gender === 'MALE' ? (
                    <img src="/male_avtar.png" className="w-full h-full object-cover" alt="Profile" />
                  ) : user.gender === 'FEMALE' ? (
                    <img src="/female_avtar.png" className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </div>
              )}
            </div>
            <div className="text-center mt-6">
              {isEditing ? (
                <SmoothInput
                  value={editedName}
                  onChange={setEditedName}
                  placeholder="Full Name"
                  className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-violet-100 dark:border-violet-900 rounded-2xl px-6 py-3 text-2xl font-black text-center text-slate-900 dark:text-white outline-none w-full max-w-[300px]"
                />
              ) : (
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">{user.name}</h2>
              )}
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em] mt-2">Student ID: {user.student_id}</p>
              <div className="flex flex-col items-center mt-1 px-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] text-center leading-relaxed opacity-70">
                  {user.class}{user.stream ? ` | ${user.stream}` : ''}
                  {user.competitive_exams && user.competitive_exams.length > 0 && (
                    <> | {user.competitive_exams.join(' | ')}</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="px-6 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center animate-shake">
                {error}
              </div>
            )}

            {/* Editing Controls for Academic Info (Only visible when editing) */}
            {isEditing && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Modify Academic Path</h3>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 space-y-6">
                  {/* Class Toggle */}
                  <div className="space-y-3 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Update Class</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Xth', 'XIIth'].map(c => (
                        <button key={c} onClick={() => setEditedClass(c)} className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${editedClass === c ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>{c}</button>
                      ))}
                    </div>
                  </div>

                  {editedClass === 'XIIth' && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Update Stream</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['PCB', 'PCM', 'PCBM', 'Commerce', 'Humanities'].map(s => (
                          <button key={s} onClick={() => setEditedStream(s)} className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all ${editedStream === s ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'bg-slate-50 text-slate-400'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitive Exams */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Competitive Ambitions</label>
                    <div className="flex flex-wrap gap-2">
                      {['JEE', 'NEET', 'CUET', 'CLAT', 'NDA', 'NTSE', 'KVPY', 'OLYMPIAD'].map(exam => (
                        <button
                          key={exam}
                          onClick={() => toggleExam(exam)}
                          className={`px-4 py-2 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all ${editedExams.includes(exam) ? 'bg-violet-600 border-violet-600 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-400'}`}
                        >
                          {exam}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Identity & Personal Info */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identity & Personal</h3>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 space-y-6">
                {/* Gender */}
                <div className="space-y-3 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      {['MALE', 'FEMALE', 'PREFER_NOT_SAY'].map(g => (
                        <button key={g} onClick={() => setEditedGender(g)} className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase transition-all ${editedGender === g ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                          {g.split('_')[0]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-50 rounded-2xl font-black text-slate-800 uppercase text-[11px] tracking-widest">{user.gender?.replace(/_/g, ' ') || 'None Set'}</div>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-3 text-left">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full p-5 bg-slate-50 border-transparent focus:border-violet-100 rounded-2xl outline-none font-bold text-sm text-slate-700 transition-all cursor-pointer"
                      value={editedDOB}
                      onChange={(e) => setEditedDOB(e.target.value)}
                    />
                  ) : (
                    <div className="p-5 bg-slate-50 rounded-2xl font-bold text-slate-700 text-sm">{user.dob ? new Date(user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set'}</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* App & Support Group */}
          <div className="space-y-4 mt-8 px-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">App & Support</h3>
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-50 space-y-2">
              <button
                onClick={() => setShowAbout(true)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">About CBSE TOPPERS</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="pt-6 px-6">
            <button
              onClick={() => { hapticsImpactLight(); localStorage.removeItem('pe_cbt_session'); window.location.reload(); }}
              className="w-full py-5 bg-white border-2 border-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-sm active:bg-red-500 active:text-white active:border-red-500 transition-all flex items-center justify-center gap-3"
            >
              Sign Out Securely
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>

        {
          isEditing && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-[60]">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  'Save Profile Updates'
                )}
              </button>
            </div>
          )
        }

        {
          showAbout && (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0f172a] flex flex-col animate-in slide-in-from-bottom-full duration-500 overflow-y-auto transition-colors">
              <div className="w-full sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-6 py-4 flex items-center justify-between">
                <button onClick={() => setShowAbout(false)} className="p-2 -ml-2 text-slate-900 dark:text-white active:scale-90 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Legal & About</h1>
                <div className="w-10" />
              </div>

              <div className="p-8 max-w-lg mx-auto space-y-12 pb-20 text-left">
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={LOGO_URL} className="w-16 h-16 rounded-2xl shadow-xl" />
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">CBSE TOPPERS</h2>
                      <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Version 2.0.0 (2026 Edition)</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    CBSE TOPPERS is a premium educational platform designed to empower students with AI-driven learning tools, competitive exam preparation, and real-time performance analytics. Our mission is to democratize high-quality education through technology.
                  </p>
                </section>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <section className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Legal Documents</h3>
                  <div className="space-y-4">
                    {[
                      { id: 'privacy', title: 'Privacy Policy', desc: 'How we handle and protect your personal data.' },
                      { id: 'terms', title: 'Terms & Conditions', desc: 'Rules and guidelines for using our platform.' },
                      { id: 'refund', title: 'Refund Policy', desc: 'Our policy regarding premium subscriptions.' },
                      { id: 'honor', title: 'Honor Code', desc: 'Commitment to academic integrity.' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setShowLegalSide(doc.id)}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-violet-100 dark:hover:border-violet-900 transition-all text-left group"
                      >
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight group-hover:text-violet-600 transition-colors mb-1">{doc.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{doc.desc}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => { setShowAbout(false); setView('help'); }}
                      className="w-full p-6 bg-violet-600 rounded-3xl border border-transparent shadow-xl active:scale-95 transition-all text-left group"
                    >
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                        Get Help & Support
                        <span className="text-lg">🆘</span>
                      </h4>
                      <p className="text-[10px] font-black text-violet-200 uppercase tracking-widest leading-relaxed">Contact CEO, Founder & Official Team</p>
                    </button>
                  </div>
                </section>

                {/* In-view Legal Content Modal */}
                {showLegalSide && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLegalSide(null)} />
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 p-10 animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{LEGAL_DATA[showLegalSide].title}</h3>
                        <button onClick={() => setShowLegalSide(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="overflow-y-auto pr-2 custom-scrollbar space-y-8">
                        {LEGAL_DATA[showLegalSide].content.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">{item.h}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.p}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowLegalSide(null)} className="w-full mt-10 py-5 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Accept & Close</button>
                    </div>
                  </div>
                )}



                <footer className="text-center pt-8">
                  <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">© 2026 CBSE TOPPERS. Made with ❤️ by Students.</p>
                </footer>
              </div>
            </div>
          )}
      </div>
    </>
  );
};


const StoreView: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [showHistory, setShowHistory] = useState(false);
  const sections = [
    {
      title: 'Latest Releases',
      items: [
        { id: 1, title: 'Ram-Baan Series Class 10 English', price: '₹99', mrp: '₹249', category: 'NEW EDITION', icon: '📖', color: 'from-blue-500 to-blue-600' },
        { id: 2, title: 'Ram-Baan Series Class 10 Hindi', price: '₹99', mrp: '₹249', category: 'NEW EDITION', icon: '📝', color: 'from-orange-500 to-orange-600' },
        { id: 3, title: 'Ram-Baan Series Class 10 Maths', price: '₹99', mrp: '₹249', category: 'NEW EDITION', icon: '📐', color: 'from-amber-500 to-amber-600' },
        { id: 4, title: 'Ram-Baan Series Class 10 Science', price: '₹99', mrp: '₹249', category: 'NEW EDITION', icon: '🔬', color: 'from-green-500 to-green-600' },
      ]
    },
    {
      title: 'Expert Formula Sheets',
      items: [
        { id: 5, title: '12th Physics Mastery Sheet', price: '₹79', mrp: '₹199', category: 'PHYSICS', icon: '⚡', color: 'from-violet-500 to-violet-600' },
        { id: 6, title: '12th Chemistry Mastery Sheet', price: '₹79', mrp: '₹199', category: 'CHEMISTRY', icon: '🧪', color: 'from-indigo-500 to-indigo-600' },
        { id: 7, title: '12th Biology Mastery Sheet', price: '₹79', mrp: '₹199', category: 'BIOLOGY', icon: '🧬', color: 'from-rose-500 to-rose-600' },
        { id: 8, title: '11th Chemistry Mastery Sheet', price: '₹79', mrp: '₹199', category: 'CHEMISTRY', icon: '⚗️', color: 'from-cyan-500 to-cyan-600' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] animate-in fade-in duration-500 text-left overflow-y-auto w-full pb-32 transition-colors">
      {/* Premium App Bar */}
      <div className="w-full sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">TOPPER'S STORE</h1>
        <button onClick={() => { hapticsImpactLight(); setShowHistory(true); }} className="p-2 -mr-2 text-slate-900 dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-10 space-y-16">
        {sections.map((section, sidx) => (
          <div key={sidx} className="space-y-6">
            <div className="px-6 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{section.title}</h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-violet-600">Explore All</button>
            </div>

            {/* Slidable Row */}
            <div className="flex overflow-x-auto gap-5 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth px-6">
              {section.items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  whileTap={{ scale: 0.96 }}
                  className="min-w-[170px] md:min-w-[210px] snap-start bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-lg shadow-slate-200/30 dark:shadow-none transition-all group overflow-hidden flex flex-col"
                >
                  {/* Poster Area with Gradient - COMPACT */}
                  <div className={`h-32 bg-gradient-to-br ${item.color} relative p-4 flex flex-col justify-between overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
                    <div className="w-fit px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[6px] font-black uppercase tracking-widest text-white border border-white/20">
                      {item.category}
                    </div>
                    <div className="text-4xl drop-shadow-xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                  </div>

                  {/* Details Area - COMPACT */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-snug line-clamp-2 h-[2.6em] overflow-hidden">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{item.price}</span>
                        <span className="text-[8px] font-bold text-slate-400 line-through leading-none mt-1">{item.mrp}</span>
                      </div>
                      <button
                        onClick={() => { hapticsImpactLight(); window.open(TG_CHANNEL, '_blank'); }}
                        className="p-2.5 bg-slate-900 dark:bg-violet-600 text-white rounded-xl shadow-md active:scale-90 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Brand Support CTA */}
        <div className="mx-6 p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white space-y-4 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <h3 className="text-lg font-black uppercase tracking-tighter">Academic Assistance</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">Need specific study material?<br />Our topper network is here to help.</p>
          <a href={TG_CHANNEL} target="_blank" className="inline-block px-10 py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Chat with Support</a>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 p-10 animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Purchase History</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transaction history found</p>
            </div>
            <button onClick={() => setShowHistory(false)} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Back to Store</button>
          </div>
        </div>
      )}
    </div>
  );
};


const HelpView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto w-full pb-20">
      <div className="w-full sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-900 dark:text-white active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Customer Support</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-md w-full p-8 space-y-10">
        <header className="text-center space-y-4">
          <div className="w-20 h-20 bg-violet-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-violet-500/20 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">Help & Feedback</h2>
          <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em]">We're here to solve your problems 24/7</p>
        </header>

        {/* Primary Contact */}
        <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-violet-400">Official Support Email</h3>
              <p className="text-xl font-black tracking-tight break-all">cbsetoppers@zohomail.in</p>
            </div>
            <a href="mailto:cbsetoppers@zohomail.in" className="inline-block px-10 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Draft an Email</a>
          </div>
        </div>

        {/* Community Links */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Join Our Community</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href={TG_CHANNEL} target="_blank" className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800 text-center space-y-3 group active:scale-95 transition-all">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:rotate-12 transition-transform">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
              </div>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">TG Channel</p>
            </a>
            <a href={TG_GROUP} target="_blank" className="p-6 bg-cyan-50 dark:bg-cyan-900/20 rounded-[2rem] border border-cyan-100 dark:border-cyan-800 text-center space-y-3 group active:scale-95 transition-all">
              <div className="w-10 h-10 bg-cyan-500 text-white rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:-rotate-12 transition-transform">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
              <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">Main Group</p>
            </a>
          </div>
        </section>

        {/* Administration Details */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Administration Team</h3>
          <div className="space-y-4">
            {/* Founder */}
            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-2xl flex items-center justify-center text-xl">👤</div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Lucky Chawla</h4>
                  <p className="text-[8px] font-black text-violet-500 uppercase tracking-widest">Founder & Developer</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={CONTACT_FOUNDER} target="_blank" className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                </a>
              </div>
            </div>

            {/* Owner */}
            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-xl">🔱</div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Tarun Kumar</h4>
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Co-Founder & Owner</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={CONTACT_OWNER} target="_blank" className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                </a>
              </div>
            </div>

            {/* CEO */}
            <div className="p-6 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-xl">🏛️</div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Abhisek Pani</h4>
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Chief Executive Officer</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={CONTACT_CEO} target="_blank" className="p-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-500 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center space-y-2 pb-10">
          <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Legal Queries: Tarun Kumar (Owner)</p>
          <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Tech Issues: Lucky Chawla (Founder)</p>
        </footer>
      </div>
    </div>
  );
};


const InternshipForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [currentClass, setCurrentClass] = useState('');
  const [board, setBoard] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [hours, setHours] = useState('');
  const [months, setMonths] = useState('');
  const [motivation, setMotivation] = useState('');
  const [contribution, setContribution] = useState('');
  const [is17Plus, setIs17Plus] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);

  const handleSubmit = async () => {
    if (!is17Plus || !agreeRules) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const getMinAgeDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  const roles = ["Content Creator", "Doubt Solver", "Admin", "Technical Team", "Social Media", "Graphic Design", "Other"];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 relative transition-colors duration-500 overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none sticky">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-sm w-full text-center animate-in fade-in zoom-in duration-700 my-8">
        {!isSubmitted ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="w-14 h-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/20 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">Internship Portal</h1>
              <div className="flex justify-center gap-1.5 mt-4">
                {[1, 2, 3, 4, 5].map(s => <div key={s} className={`h-1 flex-1 max-w-[40px] rounded-full transition-all duration-300 ${step >= s ? 'bg-violet-600' : 'bg-slate-100 dark:bg-slate-800'}`} />)}
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] text-center mb-2">Step 1: Basic Information</p>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Full Name</p>
                  <SmoothInput placeholder="Your Name" value={name} onChange={setName} />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Date of Birth</p>
                  <input
                    type="date"
                    max={getMinAgeDate()}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100 transition-all appearance-none"
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (e.target.value) setIs17Plus(true);
                    }}
                  />
                  <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest ml-4 mt-1">Min 17 years required</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Class</p>
                    <select
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100 transition-all appearance-none"
                      value={currentClass}
                      onChange={(e) => setCurrentClass(e.target.value)}
                    >
                      <option value="">Select Class</option>
                      <option value="XI">XI</option>
                      <option value="XII">XII</option>
                      <option value="Dropper">Dropper</option>
                      <option value="Passed">Passed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Board</p>
                    <select
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-violet-100 transition-all appearance-none"
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                    >
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button
                  disabled={!name || !dob || !currentClass || !board}
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50 mt-4 active:scale-95 transition-all"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] text-center mb-2">Step 2: Contact Details</p>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">WhatsApp Number</p>
                  <SmoothInput type="tel" placeholder="+91 XXXX XXXX" value={whatsapp} onChange={setWhatsapp} />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Email ID</p>
                  <SmoothInput type="email" placeholder="email@example.com" value={email} onChange={setEmail} />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Telegram @Username</p>
                  <SmoothInput placeholder="@yourusername" value={telegram} onChange={setTelegram} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Back</button>
                  <button
                    disabled={!whatsapp || !email || !telegram}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-4 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Skills & Role */}
            {step === 3 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] text-center mb-2">Step 3: Skills & Role</p>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Applying for Role</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {roles.map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl font-black text-[8px] uppercase tracking-tighter border-2 transition-all ${role === r ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Your Skills (Brief)</p>
                  <textarea
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-transparent focus:border-violet-200 outline-none font-bold text-xs min-h-[80px] resize-none"
                    placeholder="e.g. Graphic Designing, Python Coding, Content Writing..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Prior Experience (Optional)</p>
                  <SmoothInput placeholder="Where have you worked before?" value={experience} onChange={setExperience} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Back</button>
                  <button
                    disabled={!role || !skills}
                    onClick={() => setStep(4)}
                    className="flex-[2] py-4 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Availability & Motivation */}
            {step === 4 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] text-center mb-2">Step 4: Commitment</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Hours / Day</p>
                    <SmoothInput placeholder="e.g. 2-3 hrs" value={hours} onChange={setHours} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Commitment</p>
                    <SmoothInput placeholder="e.g. 3 Months" value={months} onChange={setMonths} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">Why join CBSE TOPPERS?</p>
                  <textarea
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-transparent focus:border-violet-200 outline-none font-bold text-xs min-h-[60px] resize-none"
                    placeholder="Tell us your motivation..."
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase ml-4 mb-1">How can you contribute?</p>
                  <textarea
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white border border-transparent focus:border-violet-200 outline-none font-bold text-xs min-h-[60px] resize-none"
                    placeholder="Briefly describe your contribution (2-3 lines)..."
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setStep(3)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Back</button>
                  <button
                    disabled={!hours || !months || !motivation || !contribution}
                    onClick={() => setStep(5)}
                    className="flex-[2] py-4 bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Declaration */}
            {step === 5 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] text-center mb-4">Step 5: Final Declaration</p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] space-y-4 border border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-200 text-violet-600 focus:ring-violet-500"
                      checked={is17Plus}
                      onChange={(e) => setIs17Plus(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight leading-relaxed">I am 17 years of age or older (Eligibility Requirement)</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-200 text-violet-600 focus:ring-violet-500"
                      checked={agreeRules}
                      onChange={(e) => setAgreeRules(e.target.checked)}
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight leading-relaxed">I agree to follow all community rules and internship terms</span>
                  </label>
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep(4)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-[2rem] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Back</button>
                  <button
                    disabled={isSubmitting || !is17Plus || !agreeRules}
                    onClick={handleSubmit}
                    className="flex-[2] py-4 bg-slate-900 dark:bg-violet-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                    {isSubmitting ? 'Submitting...' : 'Apply Now'}
                  </button>
                </div>
              </div>
            )}

            <button onClick={onBack} className="w-full text-slate-400 font-bold uppercase text-[9px] tracking-widest pt-4 hover:text-red-500 transition-colors">Discard Application</button>
          </div>
        ) : (
          <div className="space-y-8 py-4 text-center animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-green-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">Application Received!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                Thank you for applying, {name.split(' ')[0]}!<br />
                Our team will review your details.<br />
                Stay tuned on Telegram and Email.
              </p>
            </div>
            <button onClick={onBack} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Back to Home</button>
          </div>
        )}
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
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('topper_theme') as 'light' | 'dark') || 'light');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingNet, setIsCheckingNet] = useState(false);

  useEffect(() => {
    // Hide splash screen after app mount
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => splash.classList.add('hidden'), 800);
    }
  }, []);

  useEffect(() => {
    // Sync theme class to body
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('topper_theme', theme);
  }, [theme]);

  // Preloader Logic
  useEffect(() => {
    const bar = document.getElementById('preloader-bar');
    if (!bar) return;

    setIsLoading(true);
    bar.style.width = '30%';

    const t1 = setTimeout(() => bar.style.width = '70%', 200);
    const t2 = setTimeout(() => {
      bar.style.width = '100%';
      setTimeout(() => {
        bar.style.width = '0%';
        setIsLoading(false);
      }, 300);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [view, selectedSubject]);

  const performHealthCheck = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      // Try to fetch a small header to verify real internet connectivity
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      setIsOnline(true);
      return true;
    } catch (e) {
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    let buffer = "";
    const handleKeyDown = (e: KeyboardEvent) => {
      buffer += e.key;
      if (buffer.endsWith("==/help")) {
        setView('help');
        buffer = "";
      }
      if (buffer.length > 20) buffer = buffer.substring(buffer.length - 20);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOnline = () => { performHealthCheck(); hapticsImpactLight(); };
    const handleOffline = () => { setIsOnline(false); hapticsImpactMedium(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!window.navigator.onLine) {
      setIsOnline(false);
    } else {
      performHealthCheck();
    }

    // Proactive health check every 5 seconds
    const pingInterval = setInterval(performHealthCheck, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    const checkMaintenance = async () => {
      const data = await fetchMaintenanceStatus();
      if (data?.maintenance_enabled) {
        setIsMaintenance(true);
        setMaintenanceData(data);
      } else {
        setIsMaintenance(false);
      }
    };
    checkMaintenance();
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleZoom = (e: any) => setZoomedImg(e.detail);
    window.addEventListener('topper-zoom', handleZoom);
    return () => window.removeEventListener('topper-zoom', handleZoom);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => hapticsImpactLight();
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', disableContextMenu);

    // Native Back Button Handling
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (view === 'dashboard' || view === 'auth') {
        const confirmExit = window.confirm("Do you want to exit CBSE TOPPERS?");
        if (confirmExit) CapApp.exitApp();
      } else if (view === 'exam') {
        const confirmLeave = window.confirm("Are you sure you want to exit the exam? Your progress may be lost.");
        if (confirmLeave) setView('dashboard');
      } else {
        setView('dashboard');
      }
    });

    // Keyboard Awareness
    Keyboard.addListener('keyboardWillShow', info => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', disableContextMenu);
      backListener.then(l => l.remove());
      Keyboard.removeAllListeners();
    };
  }, [view]);

  // Sync Status Bar with Theme
  useEffect(() => {
    const updateStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0f172a' : '#ffffff' });
      } catch (e) {
        console.warn('StatusBar not available on web');
      }
    };
    updateStatusBar();
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify') === 'true') {
      setView('verify');
      return;
    }

    const saved = localStorage.getItem('pe_cbt_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robust check: it could be { user: { ... } } or just { ... }
        const restoredUser = parsed.user || parsed;
        if (restoredUser && restoredUser.student_id) {
          setUser(restoredUser);
          setView('dashboard');
        } else {
          localStorage.removeItem('pe_cbt_session');
        }
      } catch (e) {
        localStorage.removeItem('pe_cbt_session');
      }
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
    // Persist quiz result for analytics
    try {
      const history: QuizResult[] = JSON.parse(localStorage.getItem('topper_quiz_history') || '[]');
      history.push(res);
      localStorage.setItem('topper_quiz_history', JSON.stringify(history));
    } catch (_) { /* non-critical */ }
    // Also save to Supabase for real analytics
    if (user) {
      saveQuizResult({
        student_id: user.student_id,
        subject: res.subject,
        score: res.score,
        total: res.total,
        paper_id: res.paperId,
        time_spent: res.timeSpent,
      });
    }
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
    localStorage.setItem('pe_cbt_session', JSON.stringify({ user: updatedUser }));
  };

  return (
    <div className="App">
      {!isOnline && (
        <div className="fixed inset-0 z-[1000] bg-white dark:bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce-slow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536m0 0l-2.829-2.829m2.829 2.829L3 21M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">No Connection</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 max-w-[240px]">We've lost touch with our servers. Please check your internet connection.</p>
          <button
            disabled={isCheckingNet}
            onClick={async () => {
              setIsCheckingNet(true);
              const ok = await performHealthCheck();
              setIsCheckingNet(false);
              if (ok) hapticsImpactLight();
              else hapticsImpactMedium();
            }}
            className="px-10 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-violet-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
          >
            {isCheckingNet ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : null}
            {isCheckingNet ? 'Checking...' : 'Try Again'}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={view + (selectedSubject || '')}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1"
        >
          {view === 'auth' && <AuthScreen onLogin={handleLogin} setView={setView} />}
          {view === 'verify' && <VerificationPortal onBack={() => setView('auth')} />}
          {view === 'internship' && <InternshipForm onBack={() => setView('auth')} />}
          {view === 'help' && <HelpView onBack={() => setView(user ? 'dashboard' : 'auth')} />}

          {/* Authenticated Views with Maintenance Check */}
          {view !== 'auth' && view !== 'verify' && view !== 'internship' && view !== 'help' && (
            isMaintenance ? (
              <MaintenancePage data={maintenanceData} />
            ) : (
              <>
                {view === 'dashboard' && user && (
                  <Dashboard
                    user={user}
                    onStartExam={(subj, pid) => { setExamConfig({ subj, pid }); setView('exam'); }}
                    setView={setView}
                    selectedSubject={selectedSubject}
                    setSelectedSubject={setSelectedSubject}
                    theme={theme}
                    setTheme={setTheme}
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
                    setView={setView}
                    onBack={() => setView('dashboard')}
                    onUpdate={handleUpdateProfile}
                  />
                )}
                {view === 'store' && user && (
                  <StoreView
                    user={user}
                    onBack={() => setView('dashboard')}
                  />
                )}
              </>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {!isMaintenance && user && view === 'dashboard' && (
        <button
          onClick={() => { hapticsImpactLight(); setView('store'); }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-700 text-white rounded-[1.8rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex flex-col items-center justify-center active:scale-90 transition-all z-[100] group overflow-hidden border-2 border-white/20"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[7px] font-black uppercase tracking-widest relative z-10 leading-none">Store</span>
        </button>
      )}

      {/* ── Global Zoom Modal ── */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-20 animate-in fade-in zoom-in duration-300 pointer-events-auto"
          onClick={() => setZoomedImg(null)}
        >
          <button className="absolute top-10 right-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-2xl border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img
            src={zoomedImg}
            className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-white/5 animate-in slide-in-from-bottom-10 duration-500"
            alt="Zoomed Visual"
          />
        </div>
      )}
    </div>
  );
};

export default App;
