import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import { Router } from "express";
import { askAI } from "../services/aiService";
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
    const response = await askAI(messages);
    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Try to extract JSON from the AI response
    let parsedResponse;
    try {
      // Look for JSON in the response
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Fallback: Create a basic response structure
      parsedResponse = {
        overallScoreOutOf10: 5,
        parameterScores: {
          question1: 1,
          question2: 1,
          communicationSkills: 1,
          confidence: 1,
          clarityOfThought: 1,
          consistency: 0
        },
        strengths: ["Participated in the interview"],
        weaknesses: ["Unable to parse detailed feedback"],
        improvementSuggestions: ["Practice coding problems", "Improve communication"]
      };
    }

    // Transform to match frontend expectations
    const transformedResponse = {
      overallScore: parsedResponse.overallScoreOutOf10 || 5,
      maxScore: 10,
      performance: getPerformanceLevel(parsedResponse.overallScoreOutOf10 || 5),
      summary: generateSummary(parsedResponse),
      strengths: parsedResponse.strengths || [],
      weaknesses: parsedResponse.weaknesses || [],
      suggestions: parsedResponse.improvementSuggestions || [],
      skillBreakdown: {
        "Question 1": { 
          score: parsedResponse.parameterScores?.question1 || 0, 
          max: 3 
        },
        "Question 2": { 
          score: parsedResponse.parameterScores?.question2 || 0, 
          max: 3 
        },
        "Communication": { 
          score: parsedResponse.parameterScores?.communicationSkills || 0, 
          max: 1 
        },
        "Confidence": { 
          score: parsedResponse.parameterScores?.confidence || 0, 
          max: 1 
        },
        "Clarity of Thought": { 
          score: parsedResponse.parameterScores?.clarityOfThought || 0, 
          max: 1 
        },
        "Consistency": { 
          score: parsedResponse.parameterScores?.consistency || 0, 
          max: 1 
        }
      }
    };

    addMessageToSession(sessionId, { role: "assistant", content: reply });
    res.json(transformedResponse);
  } catch (err: any) {
    console.error("Interview error:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

function getPerformanceLevel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Average";
  return "Needs Improvement";
}

function generateSummary(aiResponse: any): string {
  const score = aiResponse.overallScoreOutOf10 || 0;
  return `Based on the interview performance, the candidate scored ${score}/10. Assessment includes coding ability, communication skills, and overall engagement during the technical interview.`;
}
export default router;