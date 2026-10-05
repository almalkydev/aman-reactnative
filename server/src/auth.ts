import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "worker" | "supervisor" | "admin";
  site_id: number;
};
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}
export const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters");
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }
  try {
    const payload = jwt.verify(token, secret!, {
      algorithms: ["HS256"],
      issuer: "aman",
      audience: "aman-mobile",
    });
    if (typeof payload === "string" || !payload.sub) throw new Error();
    const result = await db.query(
      "SELECT id,name,email,role,site_id FROM aman.users WHERE id=$1",
      [payload.sub],
    );
    if (!result.rowCount) throw new Error();
    req.user = result.rows[0];
  } catch {
    res
      .status(401)
      .json({ error: "Your session has expired. Please sign in again." });
    return;
  }
  next();
}
export function scope(user: User) {
  if (user.role === "admin") return { sql: "TRUE", values: [] as number[] };
  if (user.role === "supervisor")
    return { sql: "r.site_id=$1", values: [user.site_id] };
  return { sql: "r.user_id=$1", values: [user.id] };
}
export function canRead(
  user: User,
  report: { user_id: number; site_id: number },
) {
  return (
    user.role === "admin" ||
    (user.role === "supervisor"
      ? report.site_id === user.site_id
      : report.user_id === user.id)
  );
}
