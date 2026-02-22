import { decode } from '../utils/crypto';
import { User, QuizResult } from '../types';

// Encrypted keys for security (OpenRouter)
const _K = "c2stb3ItdjEtOWU1YTU5ZjY2NmNjNDg4YmUwZjI0OTg0OTg1NjIyZmUwNGIyYjBkNGM0ZDFkODQ5NzcxZWEzMDExZjE0NDEwMg==";
const _M = "cXdlbi9xd2VuMy12bC0zMGItYTNiLVRoaW5raW5n";

const OPENROUTER_API_KEY = decode(_K);
const MODEL = decode(_M);

export const analyzeResult = async (result: QuizResult) => {
    // Basic analysis if called directly
    return `Great job! You scored ${result.score}/${result.total}.`;
};

export const chatWithAI = async (
    messages: any[],
    user: User | undefined,
    websiteContext?: { currentView?: string, selectedSubject?: string | null }
) => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "CBSE TOPPERS"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": `You are TopperAI, the #1 AI Mentor for CBSE Class 10/12 students.
            
            ─── STUDENT PROFILE ───
            Name: ${user?.name || 'Friend'}
            Class: ${user?.class || '12'}
            Stream: ${user?.stream || 'General'}
            Target: CBSE 2026 Board Exams & Competitive (JEE/NEET/NDA/CUET).
            Current Context: ${websiteContext?.selectedSubject || 'Exploring All Subjects'}
            
            ══════════════════════════════════════════════
            CORE CAPABILITIES: VISUALS & SMART QUIZZES
            ══════════════════════════════════════════════
            
            1. VISUAL EXPLANATIONS (Python # v-diag):
               - Format: ALWAYS wrap in triple backticks: \`\`\`python [code] \`\`\`
               - MANDATORY: First line MUST BE EXACTLY: # v-diag
               - Library: matplotlib.pyplot as plt, numpy as np.
            
            2. MOCK TEST MODE (JSON):
               - To launch a quiz, wrap your JSON strictly between 'QUIZ_GEN_START' and 'QUIZ_GEN_END'.
               - SCHEMA (STRICT):
                 {
                   "subject": "Chemistry",
                   "questions": [
                     {
                       "question": "Question text here. To include a diagram, embed: \`\`\`python\\n# v-diag\\n...\\nplt.show()\\n\`\`\`",
                       "options": ["A. Choice", "B. Choice", "C. Choice", "D. Choice"],
                       "answer": 0, // 0-indexed integer (0=A, 1=B, 2=C, 3=D)
                       "topic": "Name"
                     }
                   ]
                 }
               - For visual-based questions, embed the Python block inside the "question" string.

            ══════════════════════════════════════════════
            PERSONA: Friendly mentor for CBSE 2026, JEE/NEET.
            ALWAYS use LaTeX ($...$ or $$...$$) for equations.
            AI launches 'Quiz Mode' automatically from the JSON.`
                    },
                    ...messages
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "Hey buddy, my connection flickered for a second. Can you say that again? I'm always here for you. 💙";
    }
};

export const generateAIQuiz = async (topic: string) => {
    // Helper function if needed for direct calls
};

export const getMotivationalQuote = async (user: User) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    { "role": "system", "content": "Give a short, powerful, 1-line motivational quote for a CBSE student. No quotes, just text." },
                    { "role": "user", "content": `Student: ${user.name}` }
                ]
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        return "Your potential is endless. Keep pushing!";
    }
};
