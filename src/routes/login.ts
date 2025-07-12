import jwt from "jsonwebtoken";
import { Router } from "express";
import config from "../config";
import { Secret } from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const token = jwt.sign({ username }, config.JWT.SECRET_KEY as Secret, {
    expiresIn: "5h",
  });
  res.json({ token : token });
});

export default router;