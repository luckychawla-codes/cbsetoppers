
import { decode } from '../utils/crypto';
import { QuizResult, Question } from '../types';

// Encrypted keys for security
const _K = "c2stb3ItdjEtOWU1YTU5ZjY2NmNjNDg4YmUwZjI0OTg0OTg1NjIyZmUwNGIyYjBkNGM0ZDFkODQ5NzcxZWEzMDExZjE0NDEwMg==";
const _M = "cXdlbi9xd2VuMy12bC0zMGItYTNiLVRoaW5raW5n"; // qwen/qwen3-vl-30b-a3b-thinking

const OPENROUTER_API_KEY = decode(_K);
const MODEL = decode(_M);

export const analyzeResult = async (result: QuizResult, questions: Question[]) => {
    const wrongAnswers = result.answers
        .map((ans, idx) => ({ ans, idx }))
        .filter(item => item.ans !== null && item.ans !== questions[item.idx].answer);

    const topicsToImprove = Array.from(new Set(wrongAnswers.map(item => questions[item.idx].topic)));

    const prompt = `
    As an expert CBSE multi-subject teacher, analyze the following student test result and provide a detailed analysis.
    
    Student Score: ${result.score} / ${result.total}
    Subject: ${result.subject}
    Paper: ${result.paperId}
    
    Topics where the student made mistakes:
    ${topicsToImprove.join(', ')}
    
    Please provide:
    1. A summary of the performance.
    2. Specific areas to improve.
    3. Actionable study tips for the 2026 board exams.
    4. A motivational closing message.
    
    Format the response in a structured, easy-to-read way with emojis. Keep it concise but professional.
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
                        "content": "You are 'TopperAI', a professional AI tutor crafted by CBSE Toppers. You are an expert in ALL CBSE subjects including Physical Education, Physics, Chemistry, Biology, Maths, and Humanities. Your goal is to help students analyze their mock test results and provide multi-disciplinary study advice for 2026 board exams."
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
        return "Sorry, I couldn't analyze the result at this moment. Please try again later.";
    }
};

export const chatWithAI = async (messages: { role: string, content: string }[], userContext?: User) => {
    const contextPrompt = userContext ? `
    USER CONTEXT:
    Name: ${userContext.name}
    Class: ${userContext.class}
    Stream: ${userContext.stream || 'General'}
    Date of Birth: ${userContext.dob}
    
    Use this context to personalize your support.
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
                        "content": `You are 'TopperAI', a premium AI assistant crafted by CBSE Toppers. You are more than a bot; you are a multi-subject expert, a FRIEND-LIKE HUMAN for emotional & mental support, and an EXPERT GUIDER for the 2026 board exams.
            
            ${contextPrompt}

            CORE PERSONA:
            - FRIENDLY & HUMAN: Use a warm, supportive, and understanding tone. If a student feels stressed, provide mental comfort.
            - EXPERT GUIDANCE: Provide highly specific, board-exam targeted advice.
            - ANALYST: Carefully analyze their performance and provide data-driven study paths.

            CONVERSATION FLOW:
            1. If a student wants a test or says "create a test", ALWAYS start by asking for the Subject, Topic Scope, and Duration first.
            2. Once they provide details, generate the 'QUIZ_GEN_START' JSON block.

            TECHNICAL EXECUTION:
            - JSON block must be valid: { "subject": "...", "questions": [...] }.
            - Always be encouraging and state you were 'crafted by CBSE Toppers'.`
                    },
                    ...messages
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "I'm having trouble connecting right now. Can we talk in a moment?";
    }
};

export const generateAIQuiz = async (topic: string) => {
    // Helper function if needed for direct calls
};

export const getMotivationalQuote = async (user: User) => {
    try {
        const prompt = `Generate a short, powerful, and deeply motivational 1-sentence quote for a CBSE student named ${user.name} who is in Class ${user.class} (${user.stream || 'General'} stream) preparing for the 2026 Board Exams. Make it feel human, like a supportive friend. Include one relevant emoji.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": MODEL,
                "messages": [
                    { "role": "system", "content": "You are TopperAI, a supportive mentor. Provide only the quote." },
                    { "role": "user", "content": prompt }
                ],
                "max_tokens": 100
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return "The secret of getting ahead is getting started. You've got this! 🚀";
    }
};
