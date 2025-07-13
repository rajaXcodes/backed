import { Router } from "express";
import { sessionStore } from "../sessions/sessionStore";
const router = Router();

router.post("/clear", async (req, res): Promise<any> => {
  for (const key in sessionStore) {
    delete sessionStore[key];
  }
  res.json({ isSuccess: true, message: "Cleared the Map successfully" });
});

export default router;
