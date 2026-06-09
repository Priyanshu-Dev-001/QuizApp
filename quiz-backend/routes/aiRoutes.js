const express = require("express");
const router = express.Router();
const axios = require("axios");

// Fallback smart responses for out-of-the-box tutor help
const getFallbackHint = (questionText, type, options = []) => {
  const lowercaseQ = questionText.toLowerCase();
  
  if (lowercaseQ.includes("gravity") || lowercaseQ.includes("acceleration")) {
    return "Think about Newton's second law of motion! Gravity pulls all objects downwards with a constant acceleration of approximately 9.8 m/s² on Earth, regardless of their mass (ignoring air resistance).";
  }
  if (lowercaseQ.includes("photosynthesis") || lowercaseQ.includes("plant")) {
    return "Remember that plants require three main inputs for photosynthesis: sunlight, water (H2O), and carbon dioxide (CO2). They convert these into glucose (energy) and release oxygen (O2) as a byproduct!";
  }
  if (lowercaseQ.includes("mitochondria") || lowercaseQ.includes("cell")) {
    return "Often referred to as the 'powerhouse of the cell'. It generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.";
  }
  if (lowercaseQ.includes("force") || lowercaseQ.includes("newton")) {
    return "Recall Newton's Laws of Motion. The first law is about Inertia. The second law is Force = Mass × Acceleration (F = ma). The third law states that every action has an equal and opposite reaction.";
  }
  if (lowercaseQ.includes("react") || lowercaseQ.includes("hooks")) {
    return "In React, Hooks (like useState or useEffect) allow you to use state and other React features without writing a class. Remember the Rules of Hooks: only call them at the top level, and only from React Function Components.";
  }

  // Generic conceptual hint
  if (type === "mcq" || type === "multiselect") {
    return `For this ${type.toUpperCase()} question, carefully read each option: [${options.join(", ")}]. Try eliminating the options that definitely contradict the core concept, and focus on the remaining choices!`;
  }
  return "Focus on the definition or core terminology associated with the query. Think about the fundamental equation or law that applies here!";
};

const getFallbackChat = (message) => {
  const msg = message.toLowerCase().trim();
  
  // 1. Comprehensive Greeting List (supporting multi-language and Hinglish)
  const greetings = [
    "hi", "hello", "hey", "hlo", "hlw", "yo", "hy", "helo", "hii", "heyy",
    "namaste", "pranam", "ram ram", "salam", "salaam", "hola", "kaise ho",
    "kese ho", "kese", "kaise", "kesa", "kaisa", "hal chal", "haal chaal",
    "kya hal", "kya haal", "sup", "wazzup", "what's up"
  ];
  
  // Detect if any greeting is included in the message
  const isGreeting = greetings.some(g => {
    // Exact match or matches as a separate word to avoid false positives (like "this" containing "hi")
    const regex = new RegExp(`\\b${g}\\b`, "i");
    return regex.test(msg);
  });
  
  // 2. Language Detection
  const isHindi = 
    msg.includes("bhai") || 
    msg.includes("kaise") || 
    msg.includes("kya") || 
    msg.includes("batao") || 
    msg.includes("tum") || 
    msg.includes("namaste") || 
    msg.includes("he") || 
    msg.includes("ho") || 
    msg.includes("naam") || 
    msg.includes("madad") || 
    msg.includes("kar") ||
    msg.includes("hlo") ||
    msg.includes("hlw") ||
    msg.includes("janta") ||
    msg.includes("pata") ||
    msg.includes("kaun");

  // 3. Handle specific conversational questions even in offline mode
  if (msg.includes("janta hai") || msg.includes("know everything") || msg.includes("jante ho") || msg.includes("know all")) {
    if (isHindi) {
      return "Haha! Main ek student companion AI hu. Abhi main offline mode me hu isliye basic replies de raha hu. Agar aap Settings me jakar Gemini API Key add karenge, toh main duniya ka kuch bhi, sach me sab kuch bata paunga! Try karke dekhein. 😊";
    }
    return "Haha! I am your study companion AI. Currently, I am in offline mode. If you add your Gemini API Key in Settings, I will be able to answer absolutely anything in the world! Give it a try. 😊";
  }

  if (msg.includes("kaun ho") || msg.includes("who are you") || msg.includes("tum kaun") || msg.includes("tera naam") || msg.includes("your name")) {
    if (isHindi) {
      return "Main hu QuizCopilot AI! Aapka personal study helper. Main aapke tests, concepts aur flashcards me madad karne ke liye bana hu. 🤖📚";
    }
    return "I am QuizCopilot AI! Your personal study helper, designed to assist you with quizzes, concepts, and flashcards. 🤖📚";
  }

  if (msg.includes("kaise ho") || msg.includes("how are you") || msg.includes("how r u")) {
    if (isHindi) {
      return "Main bilkul badhiya hu, shukriya! Aap batayein, aaj aapki padhai aur practice kaisi chal rahi hai? 🚀";
    }
    return "I am doing great, thank you! How is your study and practice going today? 🚀";
  }

  if (msg.includes("kisne banaya") || msg.includes("who made you") || msg.includes("who is your creator") || msg.includes("developer")) {
    if (isHindi) {
      return "Mujhe humare developer ne aapke QuizApp learning platform ko dynamic aur smart banane ke liye develop kiya hai! 💻✨";
    }
    return "I was created by our developer to make your QuizApp learning platform dynamic and smart! 💻✨";
  }

  // 4. Handle Greetings first
  if (isGreeting) {
    if (isHindi || msg.includes("namaste") || msg.includes("kaise") || msg.includes("hlo") || msg.includes("hlw")) {
      return "Namaste! Main hu QuizCopilot, aapka AI study companion. Aaj aap kis subject ya concept ko samajhna chahte hain? Mujhe batayein! 📚✨";
    }
    return "Hello! I am QuizCopilot, your supportive AI study companion. How can I help you clear your concepts or prepare for your quiz today? 📚✨";
  }

  // 5. Handle Specific subjects
  if (isHindi) {
    if (msg.includes("study tip") || msg.includes("padhai") || msg.includes("tips") || msg.includes("tip")) {
      return "Padhai ke liye ek shaandar tip: Pomodoro Technique use karein! 25 minutes focused padhai karein, fir 5 minutes ka break lein. Isse aapka dimag active aur fresh rahega! 🧠";
    }
    if (msg.includes("formula") || msg.includes("sutra") || msg.includes("equation")) {
      return "Physics ke kuch ahem formulas yaad rakhein: F = ma (Force), KE = 1/2 mv² (Kinetic Energy), aur V = IR (Ohm's Law). Kisi specific subject ke formulas chahiye toh batayein! 📐";
    }
    if (msg.includes("shukriya") || msg.includes("thank") || msg.includes("dhanyawad") || msg.includes("badhiya")) {
      return "Aapka swagat hai! Aise hi lagatar practice karte rahiye, aap bahut badhiya kar rahe hain! 🚀";
    }

    // Randomized generic responses for Hindi
    const hindiResponses = [
      "Yeh toh bahut badhiya sawal hai! Is topic ke core concepts par focus karein. Agar koi specific sawal hai toh paste karein, main step-by-step samjhaunga! 💡",
      "Concept ko samajhne ke liye use chote-chote hisson me divide karein. Kisi term me doubt ho toh mujhe batayein! 📐",
      "Sahi baat hai! Consistent study hi success ki key hai. Kis subject ke baare me padhna chahte hain? 🚀"
    ];
    const randomIndex = Math.floor(Math.random() * hindiResponses.length);
    return hindiResponses[randomIndex];
  }

  // English fallback responses
  if (msg.includes("study tip") || msg.includes("preparation") || msg.includes("prepare") || msg.includes("tip")) {
    return "Here is a great study tip: Try the Pomodoro Technique! Study focused for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer 15-30 minute break. This keeps your brain active and prevents burnout! 🧠";
  }
  if (msg.includes("formula") || msg.includes("equation")) {
    return "Sure! For Physics, remember: F = ma (Force), KE = 1/2 mv² (Kinetic Energy), and V = IR (Ohm's Law in Electronics). Let me know if you need any specific subject formulas! 📐";
  }
  if (msg.includes("thank") || msg.includes("cool") || msg.includes("great")) {
    return "You're very welcome! Keep up the amazing work and consistent practice. You are doing great! 🚀";
  }
  
  // Randomized generic responses for English
  const englishResponses = [
    "That is a great question! As your QuizCopilot tutor, I suggest focusing on the core principles of this topic. If you'd like, you can paste a specific problem or question here, and I'll explain the concept to you step-by-step! 💡",
    "To grasp this concept better, try breaking it down. Paste a specific question, and let's decode it together! 📐",
    "Great! What subject topic are we exploring right now? Keep asking questions to refine your learning! 🚀"
  ];
  const randomIndex = Math.floor(Math.random() * englishResponses.length);
  return englishResponses[randomIndex];
};

router.post("/chat", async (req, res) => {
  try {
    const { message, context, apiKey } = req.body;
    
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    
    // If API Key is available, call Gemini API
    if (activeKey && activeKey.trim() !== "") {
      try {
        let systemPrompt = "You are 'QuizCopilot', a supportive, encouraging, and friendly AI study companion. Keep your responses short, concise, and easy to understand (max 2-3 sentences). Format using markdown.";
        
        if (context && context.activeQuestion) {
          systemPrompt += ` The student is currently attempting a quiz. They need a conceptual hint for the following question, but do NOT reveal the correct answer under any circumstances. Question: "${context.activeQuestion}". Options: ${JSON.stringify(context.options || [])}. Question Type: ${context.type || 'mcq'}.`;
        }

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          {
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Message: ${message || "Provide a study tip or hello."}` }]
              }
            ]
          }
        );

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiResponse) {
          return res.json({ reply: aiResponse });
        }
      } catch (geminiError) {
        console.error("Gemini API Error, falling back:", geminiError.message);
      }
    }

    // Fallback Mock AI responses
    if (context && context.activeQuestion) {
      const hint = getFallbackHint(context.activeQuestion, context.type, context.options);
      return res.json({
        reply: `🔍 *QuizCopilot Hint:* ${hint}`
      });
    }

    const reply = getFallbackChat(message || "");
    res.json({
      reply
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, questionCount = 5, subject, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `Generate exactly ${questionCount} multiple-choice quiz questions about "${topic}" for the subject "${subject || 'General'}".
Return ONLY a valid JSON array with no extra text. Each question object must have:
- "question": string (the question text)
- "options": array of exactly 4 strings
- "answer": number (0-3 index of correct option)
- "type": "mcq"

Example format:
[{"question": "What is...?", "options": ["A", "B", "C", "D"], "answer": 0, "type": "mcq"}]`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          }
        );

        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = aiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return res.json({ questions, source: 'ai' });
        }
      } catch (aiErr) {
        console.error('AI Quiz Generation Error:', aiErr.message);
      }
    }
    
    // Fallback mock questions
    const mockQuestions = [
      { question: `What is the primary concept of ${topic || subject || 'this topic'}?`, options: ['Fundamental principle', 'Advanced theory', 'Practical application', 'Historical context'], answer: 0, type: 'mcq' },
      { question: `Which of the following best describes ${topic || subject || 'the concept'}?`, options: ['A systematic approach', 'A random process', 'An isolated event', 'A theoretical model'], answer: 0, type: 'mcq' },
      { question: `In the context of ${subject || 'this subject'}, what role does ${topic || 'this topic'} play?`, options: ['Central role', 'Minor role', 'No role', 'Supporting role'], answer: 0, type: 'mcq' },
      { question: `What is a key benefit of understanding ${topic || 'this concept'}?`, options: ['Better problem solving', 'Faster computation', 'Improved memory', 'Enhanced creativity'], answer: 0, type: 'mcq' },
      { question: `Which field most commonly applies ${topic || 'this concept'}?`, options: ['Science & Technology', 'Arts & Humanities', 'Sports', 'Entertainment'], answer: 0, type: 'mcq' },
    ].slice(0, questionCount);
    
    res.json({ questions: mockQuestions, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/flashcards', async (req, res) => {
  try {
    const { subject, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `Generate 8 flashcards for studying "${subject}". Return ONLY a valid JSON array. Each card must have:
- "term": string (key concept or term)
- "definition": string (clear, concise definition)
- "context": string (real-world example or usage context)

Example: [{"term": "Photosynthesis", "definition": "The process by which green plants convert sunlight into food", "context": "Plants use chlorophyll in their leaves to absorb sunlight and convert CO2 and water into glucose and oxygen"}]`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          }
        );

        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const cards = JSON.parse(jsonMatch[0]);
          return res.json({ cards, source: 'ai' });
        }
      } catch (aiErr) {
        console.error('AI Flashcard Generation Error:', aiErr.message);
      }
    }
    
    // Fallback mock flashcards
    const mockCards = [
      { term: `${subject} - Core Concept`, definition: `The fundamental principle that defines ${subject}`, context: `This is the building block for understanding advanced topics in ${subject}` },
      { term: `${subject} - Key Theory`, definition: `A well-established theoretical framework in ${subject}`, context: `Applied in research and practical problem solving within ${subject}` },
      { term: `${subject} - Important Formula`, definition: `A critical mathematical or logical relationship in ${subject}`, context: `Used to calculate and predict outcomes in ${subject} problems` },
      { term: `${subject} - Historical Background`, definition: `The origin and evolution of key ideas in ${subject}`, context: `Understanding history helps appreciate modern developments in ${subject}` },
      { term: `${subject} - Practical Application`, definition: `Real-world use cases of ${subject} concepts`, context: `Industries and fields that rely on ${subject} for innovation and progress` },
    ];
    
    res.json({ cards: mockCards, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================================
// 🔍 DOUBT SOLVER WITH IMAGE SUPPORT
// =====================================
router.post('/solve-doubt', async (req, res) => {
  try {
    const { question, image, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (!question && !image) {
      return res.status(400).json({ message: 'Question or image required' });
    }

    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `You are an expert tutor. A student has asked the following question. Provide a clear, step-by-step explanation. Be thorough but easy to understand. Use simple language.

${question ? `Question: "${question}"` : 'The student has uploaded an image with a question. Please analyze and solve it.'}

Instructions:
- If it's a math problem, show full working steps
- If it's a concept question, explain clearly with examples
- If it's a science question, explain the theory and application
- Keep the response well-structured with clear steps`;

        const parts = [{ text: prompt }];
        if (image && image.base64 && image.mimeType) {
          parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
        }

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.3 } }
        );

        const sol = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (sol) return res.json({ solution: sol, source: 'ai' });
      } catch (aiErr) {
        console.error('Doubt Solver AI Error:', aiErr.message);
      }
    }

    const fallback = question
      ? `📚 **Solution for: "${question.slice(0, 80)}"**\n\nTo solve this, follow these steps:\n\n1. **Identify the concept** — Determine which topic or formula applies here.\n2. **Break it down** — Split the problem into smaller parts.\n3. **Apply the formula/rule** — Use the relevant equation or principle.\n4. **Verify your answer** — Check if the answer makes logical sense.\n\n💡 **Tip:** Add your Gemini API Key in Settings for AI-powered step-by-step solutions!`
      : `📸 **Image Question Detected**\n\nTo get an AI-powered solution for image-based questions, please add your Gemini API Key in Settings. The AI will analyze the image and provide a complete step-by-step solution!\n\n💡 **Tip:** Go to Settings → Enter your Gemini API Key for full AI features.`;

    res.json({ solution: fallback, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================================
// 📅 AI PERSONALIZED STUDY PLAN
// =====================================
router.post('/study-plan', async (req, res) => {
  try {
    const { weakSubjects, goal, hoursPerDay, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `Create a detailed 7-day weekly study plan for a student with the following details:
- Goal: ${goal || 'General Improvement'}
- Weak/Focus Subjects: ${weakSubjects?.length > 0 ? weakSubjects.join(', ') : 'All subjects'}
- Available study time: ${hoursPerDay || '2-3 hours/day'}

Return ONLY a valid JSON object with day names as keys (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).
Each day must have:
- "difficulty": "easy" | "medium" | "hard" | "rest"
- "tasks": array of objects with "topic" (string) and "duration" (string like "45 min")

Sunday should always be "rest" with light revision tasks.

Example:
{
  "Monday": {
    "difficulty": "medium",
    "tasks": [
      {"topic": "Physics: Newton's Laws", "duration": "60 min"},
      {"topic": "Practice Problems", "duration": "30 min"}
    ]
  }
}`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } }
        );

        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const plan = JSON.parse(jsonMatch[0]);
          return res.json({ plan, source: 'ai' });
        }
      } catch (aiErr) {
        console.error('Study Plan AI Error:', aiErr.message);
      }
    }

    const subjects = weakSubjects?.length > 0 ? weakSubjects : ['Mathematics', 'Physics', 'Chemistry'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const fallbackPlan = {};
    days.forEach((day, i) => {
      if (day === 'Sunday') {
        fallbackPlan[day] = { difficulty: 'rest', tasks: [{ topic: 'Light revision of the week', duration: '30 min' }, { topic: 'Relax and recharge', duration: 'Unlimited' }] };
      } else {
        const sub = subjects[i % subjects.length];
        fallbackPlan[day] = {
          difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
          tasks: [
            { topic: `${sub}: Core concepts revision`, duration: '45 min' },
            { topic: `${sub}: Practice problems`, duration: '30 min' },
            { topic: 'Quick notes review', duration: '15 min' }
          ]
        };
      }
    });
    res.json({ plan: fallbackPlan, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================================
// 📝 AI MOCK TEST GENERATOR
// =====================================
router.post('/mock-test', async (req, res) => {
  try {
    const { subject, difficulty, questionCount = 15, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `Generate exactly ${questionCount} multiple-choice questions for a ${difficulty || 'Mixed'} difficulty mock test on "${subject || 'General Science'}".

These should be JEE/NEET exam style questions — conceptual, application-based, and challenging.

Return ONLY a valid JSON array. Each question must have:
- "question": string (clear, precise question text)
- "options": array of exactly 4 strings (plausible options, including distractors)
- "answer": number (0-3, index of correct option)
- "type": "mcq"

Make questions varied: some direct concept, some numerical, some application-based.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8 } }
        );

        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          return res.json({ questions, source: 'ai' });
        }
      } catch (aiErr) {
        console.error('Mock Test AI Error:', aiErr.message);
      }
    }

    const fallback = Array.from({ length: questionCount }, (_, i) => ({
      question: `${subject} Question ${i + 1}: Which of the following best describes the fundamental principle of ${subject}?`,
      options: [`Option A: The primary definition`, `Option B: An advanced application`, `Option C: A common misconception`, `Option D: An unrelated concept`],
      answer: 0,
      type: 'mcq'
    }));
    res.json({ questions: fallback, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================================
// 📐 FORMULA SHEET GENERATOR
// =====================================
router.post('/formula-sheet', async (req, res) => {
  try {
    const { subject, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;
    if (!subject) return res.status(400).json({ message: 'Subject required' });

    if (activeKey && activeKey.trim() !== '') {
      try {
        const prompt = `Generate a comprehensive formula sheet for "${subject}" suitable for competitive exam preparation (JEE/NEET/Board level).

Return ONLY a valid JSON object with this structure:
{
  "subject": "${subject}",
  "sections": [
    {
      "title": "Section Name",
      "formulas": [
        {
          "name": "Formula/Law Name",
          "formula": "F = ma (use plain text math notation)",
          "description": "Brief description of when/how to use it",
          "variables": "F = Force (N), m = Mass (kg), a = Acceleration (m/s²)"
        }
      ]
    }
  ]
}

Generate 4-6 sections with 4-6 formulas each. Cover all important exam topics.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }
        );
        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const sheet = JSON.parse(jsonMatch[0]);
          return res.json({ sheet, source: 'ai' });
        }
      } catch (aiErr) { console.error('Formula Sheet AI Error:', aiErr.message); }
    }

    const fallbackSheet = {
      subject,
      sections: [
        {
          title: "Core Formulas",
          formulas: [
            { name: "Basic Equation", formula: "y = mx + c", description: "Fundamental relationship in " + subject, variables: "y = output, m = slope, x = input, c = constant" },
            { name: "Key Formula 2", formula: "E = mc²", description: "Important formula for " + subject, variables: "E = Energy, m = mass, c = speed of light" },
          ]
        },
        {
          title: "Advanced Formulas",
          formulas: [
            { name: "Advanced Equation", formula: "∫f(x)dx = F(x) + C", description: "Advanced application in " + subject, variables: "f(x) = function, F(x) = antiderivative, C = constant" },
          ]
        }
      ]
    };
    res.json({ sheet: fallbackSheet, source: 'fallback' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// =====================================
// 🎯 AI WEAKNESS DETECTOR
// =====================================
router.post('/weakness-analysis', async (req, res) => {
  try {
    const { results, apiKey } = req.body;
    const activeKey = apiKey || process.env.GEMINI_API_KEY;

    if (!results || results.length === 0) {
      return res.status(400).json({ message: 'No quiz results provided' });
    }

    // Build subject stats from results
    const subjectMap = {};
    results.forEach((r) => {
      const sub = r.subject || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, score: 0, count: 0 };
      subjectMap[sub].total += r.total || 0;
      subjectMap[sub].score += r.score || 0;
      subjectMap[sub].count += 1;
    });

    const subjectStats = Object.entries(subjectMap).map(([subject, val]) => ({
      subject,
      avgScore: val.total > 0 ? Math.round((val.score / val.total) * 100) : 0,
      attempts: val.count,
    })).sort((a, b) => a.avgScore - b.avgScore);

    const weakSubjects = subjectStats.filter(s => s.avgScore < 70);

    if (activeKey && activeKey.trim() !== '') {
      try {
        const statsText = subjectStats.map(s => `${s.subject}: ${s.avgScore}% (${s.attempts} attempts)`).join(', ');
        const prompt = `You are an expert academic coach analyzing a student's quiz performance data.

Student's subject performance:
${statsText}

Total quizzes taken: ${results.length}
Weakest subjects (below 70%): ${weakSubjects.map(s => s.subject).join(', ') || 'None'}

Your task: Return ONLY a valid JSON object with this exact structure:
{
  "summary": "2-3 sentence honest but encouraging analysis of the student's overall performance",
  "weaknesses": [
    {
      "subject": "subject name",
      "score": number,
      "reason": "likely reason for low score in 1 sentence",
      "tips": ["tip 1", "tip 2", "tip 3"]
    }
  ],
  "strengths": ["subject1", "subject2"],
  "practiceQuestions": [
    {
      "subject": "subject name",
      "question": "targeted practice question",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "brief explanation of the correct answer"
    }
  ],
  "weeklyFocus": "One recommended focus area for this week"
}

Generate 2 practice questions per weak subject (max 6 total). Make questions targeted at the exact weak areas.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`,
          { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }
        );

        const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return res.json({ analysis, subjectStats, source: 'ai' });
        }
      } catch (aiErr) {
        console.error('Weakness Detector AI Error:', aiErr.message);
      }
    }

    // Fallback analysis
    const strengths = subjectStats.filter(s => s.avgScore >= 70).map(s => s.subject);
    const fallbackAnalysis = {
      summary: weakSubjects.length === 0
        ? `Great job! You're performing well across all subjects with ${results.length} quizzes completed. Keep up the consistent practice to maintain your scores.`
        : `You've completed ${results.length} quizzes and show strength in ${strengths.length > 0 ? strengths.join(' & ') : 'some areas'}. Focus on ${weakSubjects.map(s => s.subject).join(', ')} to level up your overall performance.`,
      weaknesses: weakSubjects.slice(0, 3).map(s => ({
        subject: s.subject,
        score: s.avgScore,
        reason: `Average score of ${s.avgScore}% suggests gaps in core concepts or insufficient practice.`,
        tips: [
          `Review fundamental concepts of ${s.subject} daily`,
          `Solve 10 practice problems per day from ${s.subject}`,
          `Use flashcards to memorize key formulas and definitions`,
        ],
      })),
      strengths: strengths.slice(0, 3),
      practiceQuestions: weakSubjects.slice(0, 3).map((s) => ({
        subject: s.subject,
        question: `Which of the following is a fundamental concept in ${s.subject}?`,
        options: ['Core Principle A', 'Core Principle B', 'Misconception C', 'Unrelated Concept D'],
        answer: 0,
        explanation: `Understanding the core principle is essential to building a strong foundation in ${s.subject}.`,
      })),
      weeklyFocus: weakSubjects[0]?.subject || strengths[0] || 'General Practice',
    };

    res.json({ analysis: fallbackAnalysis, subjectStats, source: 'fallback' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

