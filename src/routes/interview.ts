import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import { Router } from "express";
import { askAI } from "../services/aiService";
const router = Router();

router.post("/ask", async (req, res): Promise<any> => {
  const { sessionId, prompt } = req.body;
  console.log(sessionId,prompt);
  if (!sessionId || !prompt)
    return res.status(400).json({ error: "Missing sessionId or prompt" });

  const messages = getSessionMessages(sessionId);
  addMessageToSession(sessionId, { role: "user", content: prompt });

  try {
    const response = await askAI(messages);

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    const reply = aiReply.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

    addMessageToSession(sessionId, { role: "assistant", content: reply });
    res.json({ reply: reply });
  } catch (err: any) {
    console.error("Interview error:", err.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

export default router;
