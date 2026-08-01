import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "secure-session-key-for-admin-flashcard-site-2025-v1";

export function generateSessionToken(): string {
  const payload = "admin_authorized";
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [payload, signature] = token.split(".");
    if (payload !== "admin_authorized" || !signature) return false;

    const expectedSignature = crypto
      .createHmac("sha256", ADMIN_SECRET)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}
