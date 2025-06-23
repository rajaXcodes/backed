import {
  addMessageToSession,
  getSessionMessages,
} from "../sessions/sessionStore";
import axios from "axios";
import config from "../config";
import { Router } from "express";
const router = Router();

router.post("/ask", async (req, res): Promise<any> => {
  const { sessionId, prompt } = req.body;
  if (!sessionId || !prompt)
    return res.status(400).json({ error: "Missing sessionId or prompt" });

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
