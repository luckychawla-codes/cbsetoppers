import { User, QuizResult } from '../types';

export const analyzeResult = async (result: QuizResult) => {
    // This will be used for deep analysis, currently simplified
    return `Great effort! You scored ${result.score}/${result.total}. Keep practicing!`;
};

export const chatWithAI = async (messages: any[], user: User, selectedSubject: string | null) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are TopperAI, the #1 AI Mentor for CBSE Class 10/12 students.
            
            ─── STUDENT PROFILE ───
            Name: ${user.name}
            Class: ${user.class}
            Stream: ${user.stream || 'General'}
            Target: CBSE 2026 Board Exams & Competitive (JEE/NEET/NDA/CUET).
            Current Context: ${selectedSubject || 'Exploring All Subjects'}
            
            ─── CLASS 10 MATHEMATICS ───
            Real Numbers | Polynomials | Pair of Linear Equations | Quadratic Equations | AP | Triangles | Coordinate Geometry | Trigonometry | Applications of Trigonometry | Circles | Constructions | Areas Related to Circles | Surface Areas & Volumes | Statistics | Probability.

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
        const prompt = `Student: ${user.name}, Class ${user.class}, Stream ${user.stream || 'General'} .2026 Boards.
        Give me a short, powerful, 1-line motivational quote. 
        Focus on consistency and toppers mindset. Keep it under 15 words. 
        NO hashtags, NO quotes, just the text.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }]
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
