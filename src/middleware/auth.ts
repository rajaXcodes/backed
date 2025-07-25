import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import config from "../config";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // 401 is better for no token

  jwt.verify(token, config.JWT.SECRET_KEY as Secret, (err, user) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};
