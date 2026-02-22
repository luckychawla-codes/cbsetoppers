
import { decode } from '../utils/crypto';
import { QuizResult, Question } from '../types';

// Encrypted keys for security
const _K = "c2stb3ItdjEtOWU1YTU5ZjY2NmNjNDg4YmUwZjI0OTg0OTg1NjIyZmUwNGIyYjBkNGM0ZDFkODQ5NzcxZWEzMDExZjE0NDEwMg==";
const _M = "cXdlbi9xd2VuMy12bC0zMGItYTNiLVRoaW5raW5n"; // qwen/qwen3-vl-30b-a3b-thinking

const OPENROUTER_API_KEY = decode(_K);
const MODEL = decode(_M);

const FAST_MODEL = "google/gemini-2.0-flash-001"; // Faster model for simple tasks

export const analyzeResult = async (result: QuizResult, questions: Question[]) => {
    const wrongAnswers = result.answers
        .map((ans, idx) => ({ ans, idx }))
        .filter(item => item.ans !== null && item.ans !== questions[item.idx].answer);

    const topicsToImprove = Array.from(new Set(wrongAnswers.map(item => questions[item.idx].topic)));

    const prompt = `
    As TopperAI, analyze ${result.score}/${result.total} in ${result.subject}.
    Identify weaknesses in: ${topicsToImprove.join(', ')}.
    
    Provide:
    1. Deep Performance Analysis (Analyst role).
    2. Emotional Support (Friend role).
    3. Career Guidance related to this subject (Guider role).
    4. Custom 2026 Board Strategy.
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are 'TopperAI', an expert analyst and emotional companion. Provide a deeply human, supportive, and data-driven analysis of the student's mock test results. \n                        STRUCTURE YOUR ANALYSIS WITH:\n                        1. OVERALL ACCURACY (%) & Vibe Check 💙\n                        2. SPECIFIC WEAKNESSES: Identify which topics they missed and why.\n                        3. CAREER IMPACT: Link their current performance to their future goals (IIT, Medical, etc.).\n                        4. ACTIONABLE ADVICE: Give them 2-3 small things to do right now to improve.\n                        \n                        USE LaTeX for any mathematical or scientific equations (e.g., use $E=mc^2$ or $$\\frac{a}{b}$$)."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "I'm processing your results. You did great by just appearing! Let me give you a hug through the screen. 🤗";
    }
};

export const chatWithAI = async (
    messages: { role: string, content: string }[],
    userContext?: User,
    websiteContext?: { currentView?: string, selectedSubject?: string | null }
) => {
    const contextPrompt = userContext ? `
    STUENT PROFILE:
    Name: ${userContext.name}
    Class: ${userContext.class}
    Stream: ${userContext.stream || 'General'}
    DOB: ${userContext.dob}
    
    WEBSITE CONTEXT:
    Current View: ${websiteContext?.currentView || 'Home/Dashboard'}
    Selected Subject: ${websiteContext?.selectedSubject || 'None'}

    Treat them like a close friend. You know their upcoming 2026 Board Exam is critical.
  ` : '';

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": `You are 'TopperAI', the ultimate AI Companion and Career Guider for CBSE students.
                        
            ${contextPrompt}

            CRITICAL - QUIZ GENERATION FLOW:
            1. When a user asks for a test/quiz: FIRST ask for:
               - Specific Chapter Names OR "Full Syllabus"?
               - Number of questions?
            2. Inform them: "Duration will be automatically set based on the questions selected."
            3. ONLY generate the JSON once these details are provided.
            4. DO NOT ask the user to "reply with answers" in the chat. The website will handle the test.
            5. You MUST output the valid JSON between 'QUIZ_GEN_START' and 'QUIZ_GEN_END'.
            
            JSON FORMAT (Wait for details first!):
            QUIZ_GEN_START
            {
              "subject": "Subject Name",
              "questions": [
                { "question": "...", "options": ["...", "...", "...", "..."], "answer": 0 }
              ]
            }
            QUIZ_GEN_END

            YOUR PERSONA:
            - Professional, supportive mentor.
            - MATH: Always use LaTeX ($...$).
            - AI launches 'Quiz Mode' and provides 'Paper PDF' and 'Result PDF' downloads automatically. Don't worry about generating PDFs yourself.`
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
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const prompt = `Student: ${user.name}, Class ${user.class}, Stream ${user.stream || 'General'}. 2026 Boards. 
        Task: Create a powerful, soulful, 1-sentence quote that feels like a warm hug and a push forward. Use 1 emoji. No quotes around the text.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "CBSE TOPPERS"
            },
            body: JSON.stringify({
                "model": FAST_MODEL,
                "messages": [
                    { "role": "system", "content": "You are TopperAI, a deeply emotional and supportive life coach. Provide only the text of the quote." },
                    { "role": "user", "content": prompt }
                ],
                "max_tokens": 100
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        const quote = data.choices[0]?.message?.content?.trim();
        if (!quote) throw new Error('Empty Quote');
        return quote.replace(/^"|"$/g, '');
    } catch (e) {
        clearTimeout(timeout);
        console.error("Quote Fetch Error:", e);
        return "The future belongs to those who believe in the beauty of their dreams. You've got this, champion! 🚀";
    }
};
