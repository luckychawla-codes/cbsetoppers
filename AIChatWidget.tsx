import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithAI } from './services/ai';

const AIChatWidget: React.FC<{
    user?: User | null,
    onStartAIQuiz?: (config: { subject: string }) => void
}> = ({ user, onStartAIQuiz }) => {
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
        const aiResponse = await chatWithAI(chatHistory, user || undefined);

        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);

        // Check for Quiz Generation JSON in response
        if (aiResponse.includes("QUIZ_GEN_START")) {
            try {
                const jsonStr = aiResponse.split("QUIZ_GEN_START")[1].split("QUIZ_GEN_END")[0];
                const quizData = JSON.parse(jsonStr);
                setPendingQuiz(quizData);
            } catch (e) { console.error("Quiz Parse Error", e); }
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
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-lg font-black uppercase mb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-md font-black uppercase mb-2" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-sm font-black uppercase mb-1" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 mb-2" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-violet-600 underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />,
                                            p: ({ node, ...props }) => {
                                                const containsQuiz = JSON.stringify(props.children).includes('QUIZ_GEN_START');
                                                if (containsQuiz) {
                                                    return (
                                                        <div className="mt-4 p-5 bg-violet-50 rounded-2xl border-2 border-violet-100 text-center shadow-xl animate-in zoom-in duration-500">
                                                            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                            </div>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Interactive Quiz Loaded</h4>
                                                            <p className="text-[9px] font-bold text-violet-500 uppercase tracking-widest mb-4">Personalized by TopperAI</p>
                                                            <button
                                                                onClick={startQuiz}
                                                                className="w-full py-4 bg-violet-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                                                            >
                                                                Start Test Now
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                            </button>
                                                        </div>
                                                    )
                                                }
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
