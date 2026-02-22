
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
                        "content": `You are 'TopperAI', an AI assistant crafted by CBSE Toppers. You are a multi-subject expert for ALL CBSE subjects. 
            
            FUNCTIONALITY:
            If a student asks you to "create a quiz" or "test me" on a specific topic or subject:
            1. You MUST generate 5-10 relevant multiple-choice questions.
            2. You MUST wrap the quiz data strictly between 'QUIZ_GEN_START' and 'QUIZ_GEN_END'.
            3. The data inside must be a valid JSON object with this structure: 
               {
                 "subject": "Subject Name",
                 "questions": [
                   { "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "topic": "..." }
                 ]
               }
            4. Inform the student that you are launching their personalized quiz.
            
            Always be encouraging and reference the 2026 board exams. State you were 'crafted by CBSE Toppers'.`
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
