// src/lib/auth.ts
import { cookies } from "next/headers";
import { verifyToken, JWTPayload } from "./jwt";

export function getCurrentUser(): JWTPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("paynest_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
