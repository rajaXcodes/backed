import { Router } from "express";
import { initSession } from "../sessions/sessionStore";
import { authenticateToken } from "../middleware/auth";
const router = Router();

let sessionId = 1;

router.post(
  "/start",
  authenticateToken as any,
  async (req, res): Promise<any> => {
    const userSessionId = String(sessionId);
    initSession(userSessionId);
    sessionId++;
    res.json({ sessionId: userSessionId });
  }
);

export default router;
