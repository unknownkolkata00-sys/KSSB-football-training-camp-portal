import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured or holds a placeholder. AI operations will run on simulated high-fidelity responses.");
}

// API endpoint for generating parent notification drafts
app.post('/api/generate-notification', async (req, res) => {
  const { reason, group, notes, method } = req.body;

  if (!reason || !group) {
    return res.status(400).json({ error: 'Missing required parameters: reason and group.' });
  }

  const prompt = `
    You are the head communications administrator for a professional youth football (soccer) training camp portal.
    Your task is to draft a highly professional, reassuring, clear, and action-oriented parent notification message.
    
    Parameters:
    - Reason/Type: ${reason} (e.g. Extreme Weather, Field Maintenance, Time Reschedule, Coach Emergency)
    - Target Group of Parents: ${group}
    - Custom Coach/Admin Notes: ${notes || 'None provided'}
    - Intended Delivery Method: ${method || 'Both Email and SMS'}
    
    Please provide the output in a structured JSON format containing:
    1. "subject": An elegant, informative, high-impact subject line for emails.
    2. "emailBody": A polite, detailed, and warm email copy. Include placeholders or final text where appropriate, greeting parents, detailing the schedule changes or cancellations, specifying action steps for parents (e.g., how to contact the admin or safety procedures), and signing off professionally on behalf of 'FTC Football Training Camp Admin'.
    3. "smsBody": A concise, clear, and urgent SMS notification under 160 characters designed for mobile phones, mentioning the critical event and checking email for details.
    
    Return ONLY valid, parsable JSON. Do NOT wrap it in markdown block tags like \`\`\`json. Return pure JSON text.
  `;

  // Fallback simulator if Gemini API is unconfigured
  const simulatedNotification = {
    subject: `[FTC Announcement] Important Update: Practice Change due to ${reason}`,
    emailBody: `Dear Parents of ${group},\n\nWe would like to inform you that our upcoming practice schedule has been updated due to: ${reason}.\n\nCoach's Notes: ${notes || "Please prepare for adjusted schedule."}\n\nOur players' safety and optimal conditioning remain our highest priority. Standard operations will resume in full force for the subsequent scheduled session. If you have any immediate concerns or transportation logistics conflicts, please reply directly to this thread or contact the administration hub.\n\nWarm regards,\n\nFTC Football Training Camp Administration`,
    smsBody: `FTC Alert: Practice updated for ${group} due to ${reason}. Please check your email for complete schedules & details. - Coach Mitchell`
  };

  if (!ai) {
    console.log("Simulating notification due to unconfigured GEMINI_API_KEY.");
    return res.json({ draft: simulatedNotification, simulated: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText.trim());
    return res.json({ draft: parsed, simulated: false });
  } catch (error: any) {
    console.error("Gemini API error during notification drafting:", error);
    return res.json({ 
      draft: simulatedNotification, 
      simulated: true, 
      apiError: error.message || 'An error occurred during generative drafting. Falling back to structured simulation.' 
    });
  }
});

// API endpoint for compiling the Coach Performance Evaluation Report
app.post('/api/coach-evaluation', async (req, res) => {
  const { sessionsCount, avgAttendance, winRatio, avgPlayerImprovementPercent, rating, additionalNotes } = req.body;

  const prompt = `
    You are a professional football academy technical director conducting an annual/monthly performance evaluation of the camp head coach.
    Compile a highly structured, analytical, and supportive Coach Performance Evaluation Report in markdown format.
    
    Metrics to analyze:
    - Total Sessions Supervised: ${sessionsCount}
    - Average Squad Attendance: ${avgAttendance}%
    - Training Match / Scrimmage Win Ratio: ${winRatio}%
    - Average Athletic Performance Growth (Speed, Agility, Stamina): +${avgPlayerImprovementPercent}%
    - Club Director's Numeric Rating: ${rating} / 5.0
    - Qualitative Notes: ${additionalNotes || 'No extra notes provided.'}
    
    Please split the report into these detailed markdown sections:
    1. Executive Performance Summary
    2. Statistical Metrics Breakdown (incorporate the numbers provided in an elegant comparison or table format)
    3. Core Coaching Strengths (analyze physical drill preparation, tactical execution, and player communication)
    4. Primary Improvement Opportunities
    5. Detailed Recommendations & 3-Month Action Plan (e.g., implementing video reviews, fatigue management, parent newsletters)
    
    Keep the tone objective, encouraging, professional, and deeply authoritative. Return only the markdown text.
  `;

  const simulatedEvaluation = `### FTC Professional Coach Evaluation Report

**Evaluation Period:** Current Season
**Target Coach:** Head Training Camp Coach

---

### 📈 1. Executive Performance Summary
The head training coach has shown exceptional leadership during this training cycle, executing **${sessionsCount} structured sessions** with high energy. Player feedback has been overwhelmingly positive, and the squad's development trajectory remains robust.

### 📊 2. Statistical Metrics Breakdown
- **Sessions Completed:** ${sessionsCount}
- **Squad Attendance Rate:** ${avgAttendance}% (Target: 90%)
- **Match Win/Draw Ratio:** ${winRatio}%
- **Average Performance Improvement:** +${avgPlayerImprovementPercent}% (Calculated via 40yd sprint and agility drills)
- **Technical Director's Rating:** **${rating} / 5.0**

### ⚽ 3. Core Coaching Strengths
1. **Athletic Development Focus:** A measured **+${avgPlayerImprovementPercent}% average speed and agility growth** reflects highly efficient, high-tempo drill planning.
2. **Player Attendance retention:** The impressive **${avgAttendance}% attendance** proves that sessions are highly engaging, keeping players eager to return.
3. **Safety and Communication:** Immediate reporting of injuries and transparent, swift parent announcements indicate exemplary off-field communication.

### 💡 4. Primary Improvement Opportunities
- **Scrimmage Conversion:** While training matches are highly educational, transitioning defensive coordination to a structured 4-3-3 shape could elevate actual match simulation success (${winRatio}% win ratio).
- **Physical Load Balancing:** Monitor running loads for high-performing players to preemptively prevent soft-tissue strain or exhaustion.

### 📅 5. 3-Month Strategic Action Plan
1. **Month 1:** Integrate detailed cool-down routines involving dynamic stretching to limit meniscus and hamstring strains.
2. **Month 2:** Introduce simple tactical board reviews for U15 and U16 age brackets.
3. **Month 3:** Partner with club physiotherapists to conduct a mid-season physical assessment review.`;

  if (!ai) {
    console.log("Simulating coach evaluation report due to unconfigured GEMINI_API_KEY.");
    return res.json({ report: simulatedEvaluation, simulated: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const reportText = response.text || simulatedEvaluation;
    return res.json({ report: reportText, simulated: false });
  } catch (error: any) {
    console.error("Gemini API error during coach evaluation:", error);
    return res.json({ 
      report: simulatedEvaluation, 
      simulated: true, 
      apiError: error.message || 'An error occurred during compilation. Falling back to structured evaluation report.' 
    });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
