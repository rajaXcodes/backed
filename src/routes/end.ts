import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import axios from "axios";
import config from "../config";
import { Router } from "express";
const router = Router();

const prompt = ` The interview has now concluded. Please now provide a structured and **realistic** final evaluation of the candidate based on their actual performance throughout the DSA interview.

Use the **entire chat history** to analyze whether they attempted and completed the coding questions and how well they communicated and engaged.

Your evaluation must include:

1. A short summary of overall performance — clearly state whether the candidate attempted both questions, only one, or none.

2. Then, give a breakdown using this object structure:

{
  "overallScoreOutOf10": number, // Distribute marks strictly as explained below
  "parameterScores": {
    "question1": number,           // out of 3 — based on code correctness & approach
    "question2": number,           // out of 3 — if not attempted or wrong, give 0 or 1
    "communicationSkills": number, // out of 1 — based on how clearly they explained
    "confidence": number,          // out of 1 — did they sound confident or unsure?
    "clarityOfThought": number,    // out of 1 — logical and structured answers?
    "consistency": number          // out of 1 — consistent participation throughout?
  },
  "strengths": ["Clear, concise bullet points only"],
  "weaknesses": ["Mention actual gaps noticed in their solutions or behavior"],
  "improvementSuggestions": ["Specific, helpful suggestions for improvement"],
  "whatTheyDidWell": ["Code clarity, logical thinking, or structure if any"],
  "whatTheyCanDoBetter": ["Missed edge cases, lack of code, confusion in logic"]
}

3. **Scoring Rule (Strict):**
- Question 1: Max 3 marks
- Question 2: Max 3 marks
- Remaining 4 marks (1 each for communication, confidence, clarity, consistency)
- If the candidate did not write code or gave incomplete logic, **do not give more than 1 or 2 total marks** for both questions.
- If only one question was attempted, score the second as 0.
- If behavior was passive or inconsistent, deduct accordingly from remaining 4.

4. **Avoid politeness bias** — be honest and critical like a real interviewer. Do not give high scores unless clearly justified.

5. End with a short, professional closing remark based on actual performance, like:
- “Needs more coding practice and better problem understanding.”
- “Good effort. Try improving code structure and clarity.”
- “Well done. Consistent and confident performance.”

Only provide the response **after reviewing the entire session context** including code submissions and explanations.
`;

router.post("/end", async (req, res): Promise<any> => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  const messages = getSessionMessages(sessionId);
  addMessageToSession(sessionId, { role: "user", content: prompt });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER.APIKEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;
    console.log(aiReply);
    addMessageToSession(sessionId, { role: "assistant", content: aiReply });
    res.json({ reply: aiReply });
  } catch (err: any) {
    console.error("Interview error:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
