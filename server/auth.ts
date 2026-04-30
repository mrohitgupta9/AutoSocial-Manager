import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db.ts";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

export async function registerUser(email: string, password: string, name: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  const id = crypto.randomUUID();

  try {
    db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)")
      .run(id, email, hash, name);
    return { id, email, name };
  } catch (err) {
    throw new Error("User already exists or registration failed.");
  }
}

export async function loginUser(email: string, password: string) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) throw new Error("Invalid email or password.");

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error("Invalid email or password.");

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}
