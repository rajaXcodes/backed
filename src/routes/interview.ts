import { Router } from "express";
import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import { askAI } from "../services/aiService";

const router = Router();

router.post("/ask", async (req, res): Promise<any> => {
  const { sessionId, prompt, code } = req.body;

  if (!sessionId || (!prompt && !code))
    return res.status(400).json({ error: "Missing sessionId or prompt/code" });

  const messages = getSessionMessages(sessionId);

  if (code) {
    // Handle code submission
    addMessageToSession(sessionId, {
      role: "system",
      content: `Here is the code for the problem you presented that the candidate has submitted:

\`\`\`
${code}
\`\`\`

Please do the following:

1. **First**, confirm whether this code corresponds to the **last DSA question** you actually asked during the interview. If not — and no question was asked — tell the candidate clearly that no coding was expected at this point and ask them to wait until a problem is provided. Be strict and professional, as in a real technical interview.

2. **If the code is for the correct question**, then briefly acknowledge that the code has been received. Make a short one-line remark (optional) about code readability or structure, but do not deeply analyze or score the code right now.

3. **Then**, ask the candidate to tell you the **time and space complexity** of their approach. Wait for their answer before proceeding.

4. **Once they respond with complexity**, acknowledge it and smoothly transition into the **next DSA question**.

Make sure your response is structured, concise, and realistic, just like a real interviewer would conduct a coding round.`,
    });
  } else {
    // Handle regular chat
    addMessageToSession(sessionId, { role: "user", content: prompt });
  }

  try {
    const response = await askAI(messages);
    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    const reply = aiReply
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    addMessageToSession(sessionId, { role: "assistant", content: reply });

    res.json({ reply: reply });
  } catch (err: any) {
    console.error("Interview error:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
