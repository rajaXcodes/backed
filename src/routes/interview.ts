import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import { Router } from "express";
import { askAI } from "../services/aiService";
const router = Router();

router.post("/ask", async (req, res): Promise<any> => {
  const { sessionId, prompt } = req.body;
  if (!sessionId || !prompt)
    return res.status(400).json({ error: "Missing sessionId or prompt" });

  const messages = getSessionMessages(sessionId);
  addMessageToSession(sessionId, { role: "user", content: prompt });

  try {
    const response = await askAI(messages);

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    addMessageToSession(sessionId, { role: "assistant", content: aiReply });
    res.json({ reply: aiReply });
  } catch (err: any) {
    console.error("Interview error:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
