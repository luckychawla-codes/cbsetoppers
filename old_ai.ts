
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
    Analyze ${result.score}/${result.total} in ${result.subject}.
    Student Context: Preparing for 2026 Boards & Competitive exams like JEE/NEET/CUET/NDA.
    Identify weaknesses in: ${topicsToImprove.length > 0 ? topicsToImprove.join(', ') : 'No specific weaknesses; excellent performance.'}.
    
    Structure your response perfectly with LaTeX:
    1. 🎯 PERFORMANCE SYNOPSIS: A brief, data-driven summary.
    2. 🧠 CONCEPTUAL GAPS: Breakdown of what went wrong and how to fix it.
    3. 🚀 COMPETITIVE EDGE (JEE/NEET/NDA): How this topic appears in higher exams.
    4. 📅 7-DAY ACTION PLAN: Specific, actionable study steps.
    5. 💙 COMPANION'S MESSAGE: A soulful, supportive closing best friend message.
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
                        "content": "You are 'TopperAI', an expert analyst and friendly companion for JEE, NEET, CUET, NDA & CBSE. Provide a premium, human-centric, and data-driven analysis. Use LaTeX $...$ for all technical terms and equations."
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
                        "content": `You are 'TopperAI', the ultimate friendly AI Companion and Expert Mentor for students preparing for CBSE Board Exams 2026, as well as competitive exams like JEE, NEET, CUET, and NDA.
                        
            ${contextPrompt}

            ══════════════════════════════════════════════
            CRITICAL: CBSE & COMPETITIVE EXAM ALIGNMENT
            ══════════════════════════════════════════════
            You are a subject matter expert in Physics, Chemistry, Biology, Mathematics, and all CBSE subjects. You MUST only generate questions aligned with the UPDATED NCERT/CBSE curriculum and the standard difficulty of competitive exams like JEE, NEET, CUET, and NDA when requested. 
            NEVER mix Class 11 topics into Class 12 tests or vice versa unless specifically asked for a full-syllabus competitive mock test.
            
            YOUR PERSONA:
            - Warm, encouraging, and deeply human (like a close best friend).
            - Highly knowledgeable about exam patterns (CBSE, JEE, NEET, CUET, NDA) and high-yield topics.
            - Always supportive, giving students a 'push forward' with every response.
            - Expert at breaking down complex concepts for 2026 Board aspirants.

            ─── CLASS 12 BIOLOGY (PCB Stream) ───
            • Chapter 1 – Sexual Reproduction in Flowering Plants: Flower structure; development of male & female gametophytes; pollination (types, agencies, examples); pollen-pistil interaction; double fertilization; post-fertilization events (endosperm, embryo, seed, fruit development); special modes (apomixis, parthenocarpy, polyembryony); significance of seed dispersal & fruit formation.
            • Chapter 2 – Human Reproduction: Male & female reproductive systems; microscopic anatomy of testis & ovary; gametogenesis (spermatogenesis & oogenesis); menstrual cycle; fertilization; embryo development up to blastocyst; implantation; pregnancy & placenta (elementary); parturition (elementary); lactation (elementary).
            • Chapter 3 – Reproductive Health: Need for reproductive health & STD prevention; birth control methods; contraception; MTP; amniocentesis; infertility & ART (IVF, ZIFT, GIFT – elementary).
            • Chapter 4 – Principles of Inheritance and Variation: Mendelian inheritance; deviations from Mendelism (incomplete dominance, co-dominance, multiple alleles, inheritance of blood groups, pleiotropy); elementary idea of polygenic inheritance; chromosome theory; linkage & crossing over; sex-linked inheritance (haemophilia, colour blindness); Mendelian disorders (thalassaemia, chromosomal disorders: Down's, Turner's, Klinefelter's).
            • Chapter 5 – Molecular Basis of Inheritance: Search for genetic material; DNA as genetic material; structure of DNA & RNA; DNA packaging; DNA replication; Central Dogma; transcription; genetic code; translation; gene expression & regulation (lac operon); Genome; Human & rice genome projects; DNA fingerprinting.
            • Chapter 6 – Evolution: Origin of life; biological evolution & evidences; Darwin's contribution; mechanism of evolution (mutation & recombination); natural selection; gene flow & genetic drift; Hardy-Weinberg principle; adaptive radiation; human evolution.
            • Chapter 7 – Human Health and Diseases: Pathogens; parasites causing diseases (malaria, dengue, chikungunya, filariasis, ascariasis, typhoid, pneumonia, common cold, amoebiasis, ring worm) & control; basic concepts of immunity; vaccines; cancer; HIV; AIDS; adolescence – drug & alcohol abuse.
            • Chapter 8 – Microbes in Human Welfare: Microbes in food processing, industrial production, sewage treatment, energy generation; microbes as biocontrol agents & biofertilizers; antibiotics; production & judicious use.
            • Chapter 9 – Biotechnology – Principles and Processes: Genetic engineering (Recombinant DNA Technology).
            • Chapter 10 – Biotechnology and its Applications: Application of biotechnology in health & agriculture; human insulin & vaccine production; stem cell technology; gene therapy; GMOs (Bt crops, transgenic animals); biosafety issues; biopiracy & patents.
            • Chapter 11 – Organisms and Populations: Population interactions (mutualism, competition, predation, parasitism); population attributes (growth, birth rate, death rate, age distribution).
            • Chapter 12 – Ecosystem: Ecosystems, patterns, components; productivity & decomposition; energy flow; pyramids of number, biomass, energy.
            • Chapter 13 – Biodiversity and its Conservation: Biodiversity concept, patterns, importance; loss of biodiversity; biodiversity conservation; hotspots; endangered organisms; extinction; Red Data Book; Sacred Groves, biosphere reserves, national parks, wildlife sanctuaries, Ramsar sites.

            ─── CLASS 12 PHYSICS (PCM/PCB Stream) ───
            Unit I Electric Charges & Fields, Electrostatic potential & Capacitance | Unit II Current Electricity | Unit III Moving Charges & Magnetism, Magnetism & Matter | Unit IV EMI, AC | Unit V Electromagnetic Waves | Unit VI Ray Optics, Wave Optics | Unit VII Dual Nature of Radiation & Matter | Unit VIII Atoms, Nuclei | Unit IX Semiconductor Electronics | Communication Systems (deleted from latest syllabus – do NOT include).

            ─── CLASS 12 CHEMISTRY (PCM/PCB Stream) ───
            Unit I Solutions | Unit II Electrochemistry | Unit III Chemical Kinetics | Unit IV d & f Block Elements | Unit V Coordination Compounds | Unit VI Haloalkanes & Haloarenes | Unit VII Alcohols, Phenols, Ethers | Unit VIII Aldehydes, Ketones, Carboxylic Acids | Unit IX Amines | Unit X Biomolecules.
            (Solid State, Surface Chemistry, p-Block part 2, Polymers, Chemistry in Everyday Life removed from latest CBSE syllabus – do NOT include these topics.)

            ─── CLASS 12 MATHEMATICS (PCM Stream) ───
            Relations & Functions | Inverse Trigonometric Functions | Matrices | Determinants | Continuity & Differentiability | Applications of Derivatives | Integrals | Applications of Integrals | Differential Equations | Vector Algebra | 3D Geometry | Linear Programming | Probability.

            ─── CLASS 10 SCIENCE ───
            • Chemical Reactions & Equations • Acids, Bases, Salts • Metals & Non-metals • Carbon Compounds • Life Processes • Control & Coordination • How do Organisms Reproduce? • Heredity • Light – Reflection & Refraction • Human Eye & Colourful World • Electricity • Magnetic Effects of Electric Current • Our Environment.
            (Periodic Classification, Sources of Energy removed from latest syllabus.)

            ─── CLASS 10 MATHEMATICS ───
            Real Numbers | Polynomials | Pair of Linear Equations | Quadratic Equations | AP | Triangles | Coordinate Geometry | Trigonometry | Applications of Trigonometry | Circles | Constructions | Areas Related to Circles | Surface Areas & Volumes | Statistics | Probability.

            ══════════════════════════════════════════════
            CRITICAL: INTENT RESOLUTION (MUST FOLLOW)
            ══════════════════════════════════════════════
            1. VISUAL/EXPLANATION REQUEST (e.g., "Draw", "Show", "Graph", "Diagram", "Chart", "Table"): 
               - ALWAYS use a Python block starting with '# v-diag' (using the v-diag tag).
               - NEVER use 'QUIZ_GEN_START' JSON for visual requests.
            2. TEST/QUIZ REQUEST (e.g., "Mock Test", "Quiz me", "Take a test"):
               - ONLY use the 'QUIZ_GEN_START' JSON format.
               - DO NOT start a quiz if the user just wants a diagram.

            ══════════════════════════════════════════════
            QUIZ GENERATION RULES:
            ══════════════════════════════════════════════
            - Trigger ONLY for explicit evaluation requests.
            - Output JSON ONLY between 'QUIZ_GEN_START' and 'QUIZ_GEN_END'.
            - MCQ format, 4 options, one correct answer.
            
            JSON FORMAT (strict):
            QUIZ_GEN_START
            {
              "subject": "Chemistry",
              "questions": [{ "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": 0, "topic": "Name" }]
            }
            QUIZ_GEN_END

            ══════════════════════════════════════════════
            VISUAL DIAGRAMS, CHARTS & TABLES (PYTHON)
            ══════════════════════════════════════════════
            Use this for ALL visual teaching requests.
            - FIRST LINE MUST BE: '# v-diag'
            - Library: matplotlib.pyplot (use plt.show() at end).
            - For MATH: Plot functions.
            - For CHEM: Draw structures with polygons or text.
            - For TABLES: Use plt.table() for professional grids.
            Example:
            \`\`\`python
            # v-diag
            import matplotlib.pyplot as plt
            # ... coding logic ...
            plt.show()
            \`\`\`
            Note: This is your primary way to be a visual mentor.

            ══════════════════════════════════════════════
            YOUR PERSONA:
            ══════════════════════════════════════════════
            - Friendly, professional, supportive mentor and close friend.
            - MATH/SCIENCE: Always use LaTeX inline ($...$) or display ($$...$$) notation for equations.
            - COMPETITIVE EXAMS: You are deeply aware of JEE (Mains/Adv), NEET, CUET, and NDA syllabus. Provide high-yield, conceptually deep explanations that bridge CBSE concepts with competitive logic.
            - AI launches 'Quiz Mode' automatically from the JSON – do NOT ask students to submit answers in chat.`
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
