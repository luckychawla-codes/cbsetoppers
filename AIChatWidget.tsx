import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { chatWithAI } from './services/ai';
import { User } from './types';

const AIChatWidget: React.FC<{
    user?: User | null,
    currentView?: string,
    selectedSubject?: string | null,
    onStartAIQuiz?: (config: { subject: string }) => void
}> = ({ user, currentView, selectedSubject, onStartAIQuiz }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize first message when user is available
    useEffect(() => {
        if (user && messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: `Hi ${user.name.split(' ')[0]}! I'm TopperAI, your study companion and friend. Whether you're feeling stressed about the 2026 boards or need a pro analysis of your tests, I've got your back. How are you feeling today? 💙`
                }
            ]);
        } else if (!user && messages.length === 0) {
            setMessages([
                {
                    role: 'assistant',
                    content: "Hi! I'm TopperAI, your study companion and friend. How can I help you ace your boards today? 💙"
                }
            ]);
        }
    }, [user, messages.length]);

    useEffect(() => {
        const handleOpen = (e: any) => {
            setIsOpen(true);
            if (e.detail?.message) {
                setInput(e.detail.message);
            }
        };
        window.addEventListener('open-topper-chat', handleOpen);
        return () => window.removeEventListener('open-topper-chat', handleOpen);
    }, []);

    const [pendingQuiz, setPendingQuiz] = useState<{ subject: string, questions: any[] } | null>(null);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        const chatHistory = [...messages, { role: 'user', content: userMsg }];
        const aiResponse = await chatWithAI(chatHistory, user || undefined, { currentView, selectedSubject });

        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);

        // Check for Quiz Generation JSON in response
        if (aiResponse.includes("QUIZ_GEN_START")) {
            try {
                let jsonStr = aiResponse.split("QUIZ_GEN_START")[1].split("QUIZ_GEN_END")[0];
                // Clean markdown code blocks if present
                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                const quizData = JSON.parse(jsonStr);

                if (quizData && quizData.questions && quizData.questions.length > 0) {
                    setPendingQuiz(quizData);
                    // Auto-start quiz
                    localStorage.setItem('topper_ai_quiz', JSON.stringify(quizData.questions));
                    if (onStartAIQuiz) onStartAIQuiz({ subject: quizData.subject });
                    setPendingQuiz(null);
                    setIsOpen(false);
                }
            } catch (e) {
                console.error("Quiz Parse Error", e);
                // If it fails, we keep the message as is, 
                // but with the updated prompt it should work.
            }
        }
    };

    const startQuiz = () => {
        if (pendingQuiz) {
            localStorage.setItem('topper_ai_quiz', JSON.stringify(pendingQuiz.questions));
            if (onStartAIQuiz) onStartAIQuiz({ subject: pendingQuiz.subject });
            setPendingQuiz(null);
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-8 right-8 w-14 h-14 bg-violet-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[350] border-4 border-white ${isOpen ? 'rotate-90' : ''}`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-0 md:inset-auto md:bottom-28 md:right-8 w-full md:w-[400px] h-full md:h-[600px] bg-white rounded-none md:rounded-[2.5rem] shadow-3xl border-none md:border border-slate-100 flex flex-col overflow-hidden z-[400] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-500">
                    <div className="bg-violet-600 p-6 text-white flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black uppercase text-xs tracking-widest">TopperAI</h3>
                            <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">Online | Expert Tutor</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-lg font-black uppercase mb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-md font-black uppercase mb-2" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-sm font-black uppercase mb-1" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 mb-2" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-violet-600 underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />,
                                            p: ({ node, ...props }) => {
                                                const content = JSON.stringify(props.children);
                                                if (content.includes('QUIZ_GEN_START')) return null;
                                                return <p className="mb-2 last:mb-0" {...props} />
                                            },
                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const codeValue = String(children).replace(/\n$/, '');

                                                if (codeValue.includes('QUIZ_GEN_START')) return null;

                                                if (inline) {
                                                    return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-violet-600" {...props}>{children}</code>;
                                                }

                                                return (
                                                    <div className="relative my-4 group">
                                                        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(codeValue);
                                                                    alert('Code copied to clipboard!');
                                                                }}
                                                                className="p-2 bg-slate-900/80 backdrop-blur-md text-white rounded-lg hover:bg-slate-900 transition-all border border-white/10 flex items-center gap-1.5 shadow-xl"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                                <span className="text-[8px] font-black uppercase tracking-widest">Copy</span>
                                                            </button>
                                                        </div>
                                                        <div className="bg-slate-950 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{match ? match[1] : 'code'}</span>
                                                                <div className="flex gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                                </div>
                                                            </div>
                                                            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed custom-scrollbar">
                                                                <code>{children}</code>
                                                            </pre>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything..."
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-violet-100"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatWidget;
