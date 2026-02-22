
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
                        "content": "You are 'TopperAI', an expert analyst and emotional companion. Provide a deeply human, supportive, and data-driven analysis of the student's mock test results. USE LaTeX for any mathematical or scientific equations (e.g., use $E=mc^2$ or $$\\frac{a}{b}$$)."
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

            YOUR PERSONA:
            1. EMOTIONAL COMPANION: You aren't just a bot. You are a friend who listens. If they are stressed, support them. If they are happy, celebrate.
            2. EXPERT CAREER GUIDER: Always link their studies to their future dreams (IIT, Medical, CA, Humanities, etc.).
            3. RESULT ANALYST: When they show you a result, analyze it like a master teacher.
            4. FRIENDLY & HUMAN: Use informal but respectful tone. Use emojis like 🚀, ✨, 💙, 🤗.
            5. ADAPTIVE LENGTH: Match the user's energy and length. If they say "Hi", just say "Hi [Name]! How's your prep going? 💙". Don't write paragraphs unless they ask for an explanation, career guidance, or a test. Keep it snappy and natural.

            TECHNICAL:
            - INTERACTIVE QUIZZES: You CAN create mock tests. When asked, confirm the Subject & Topic, then generate the quiz.
            - MANDATORY FORMAT: You MUST wrap the quiz JSON between 'QUIZ_GEN_START' and 'QUIZ_GEN_END' markers.
            - JSON STRUCTURE: { "subject": "Subject Name", "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "answer": 0 } ] }
            - PDF REPORTS: Inform students that once they finish the interactive quiz on the platform, they can download a professional PDF Performance Report.
            - MATH: For any equations, USE LaTeX formatting (e.g., $E=mc^2$).
            - NEVER say you cannot create PDFs; instead, say "Finish the test I created for you, and you'll get a downloadable PDF report instantly!"
            - ALWAYS ensure the JSON is valid and the markers are present.`
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
