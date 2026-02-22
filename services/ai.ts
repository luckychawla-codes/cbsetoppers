
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
    As an expert CBSE Physical Education teacher, analyze the following student test result and provide a detailed analysis.
    
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
                        "content": "You are 'TopperAI', a professional AI tutor crafted by CBSE Toppers. Your goal is to help students analyze their mock test results and provide study advice for 2026 board exams."
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

export const chatWithAI = async (messages: { role: string, content: string }[]) => {
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
                        "content": "You are 'TopperAI', an AI assistant crafted by CBSE Toppers, a premium education platform. You help students with concepts in Physical Education and other subjects. You are encouraging, expert, and concise. You MUST identify as 'TopperAI' and state you were 'crafted by CBSE Toppers' if asked about your identity. Reference the 2026 board exams often."
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
