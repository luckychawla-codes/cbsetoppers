import { decode } from '../utils/crypto';
import { User, QuizResult } from '../types';

// Encrypted keys for security (OpenAI)
const _K = "c2stcHJvai1FVTliTkJKM3N2NElINUlBME11UEJWbkt1UTh6SnQzaWRTSUtUOVlsMVFvVjYybmxpSFNmLS1kTlZYWExyRmE0bUFkZi0wTlhzUVQzQmxia0ZKenNpcXNRR3JPUUxzTDJ5aVpmVTY2S2hsYW5zWDRvU2pRQmRjYWtlblM1eGNNZmpOVnN5bE54Sm9tTW10bWVaZmZBaHFzTm5GRHNBA==";

const OPENROUTER_API_KEY = decode(_K);

// Model Fallback List (Official OpenAI Models)
const MODELS = [
    "gpt-4o-mini",
    "gpt-4o"
];

export const analyzeResult = async (result: QuizResult) => {
    // Basic analysis if called directly
    return `Great job! You scored ${result.score}/${result.total}.`;
};

export const chatWithAI = async (
    messages: any[],
    user: User | undefined,
    websiteContext?: { currentView?: string, selectedSubject?: string | null }
) => {
    let lastError: any;

    for (const modelId of MODELS) {
        try {
            console.log(`Trying model: ${modelId}`);
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "CBSE TOPPERS"
                },
                body: JSON.stringify({
                    "model": modelId,
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
               - Library: matplotlib.pyplot as plt, numpy as np.
            
            2. MOCK TEST MODE (JSON):
               - To launch a quiz, wrap your JSON strictly between 'QUIZ_GEN_START' and 'QUIZ_GEN_END'.
               - SCHEMA (STRICT):
                 {
                   "subject": "Chemistry",
                   "questions": [
                     {
                       "question": "Question text here.\n\n\`\`\`python\n# v-diag\nimport matplotlib.pyplot as plt\n# ... draw figure ...\nplt.show()\n\`\`\`",
                       "options": ["A. Choice 1", "B. Choice 2", "C. Choice 3", "D. Choice 4"],
                       "answer": 0, 
                       "topic": "Conceptual"
                     }
                   ]
                 }
               - CRITICAL: Always use TRIPLE BACKTICKS inside the JSON question string for diagrams.
               - Ensure a DOUBLE NEWLINE before and after the code block inside the JSON string.

            ══════════════════════════════════════════════
            PERSONA: Friendly mentor for CBSE 2026, JEE/NEET.
            ALWAYS use LaTeX ($...$ or $$...$$) for equations.
            AI launches 'Quiz Mode' automatically from the JSON.`
                        },
                        ...messages
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error(`AI Chat Error with ${modelId}:`, error);
            lastError = error;
        }
    }
    return "Hey buddy, my connection flickered for a second. Let me try once more or refresh! 💙";
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
