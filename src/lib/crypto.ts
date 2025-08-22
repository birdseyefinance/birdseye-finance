import crypto from "crypto";

const keyB64 = process.env.ENCRYPTION_KEY ?? "";
const KEY = keyB64 ? Buffer.from(keyB64, "base64") : null;

// Simple AES-256-GCM "gcm.v1.<iv>.<tag>.<cipher>" envelope
function gcmEncrypt(plaintext: string): string {
  if (!KEY) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm.v1.${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}
function gcmDecrypt(sealed: string): string {
  if (!KEY) return sealed;
  if (!sealed.startsWith("gcm.v1.")) return sealed;
  const parts = sealed.split(".");
  if (parts.length !== 5) return sealed;
  const iv = Buffer.from(parts[2], "base64");
  const tag = Buffer.from(parts[3], "base64");
  const data = Buffer.from(parts[4], "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

export function seal(obj: any): string {
  try { return KEY ? gcmEncrypt(JSON.stringify(obj)) : JSON.stringify(obj); } catch { return ""; }
}
export function unseal(s: string): any {
  try {
    const maybe = gcmDecrypt(s);
    return JSON.parse(maybe);
  } catch {
    try { return JSON.parse(s); } catch { return null; }
  }
}

/** Tries multiple shapes:
 *  - JSON: { access_token } | { access } | { plaid: { access_token } }
 *  - { sealed: "gcm.v1...." } (then JSON inside)
 *  - sealed string "gcm.v1...."
 *  - raw token string
 */
export function extractAccessToken(metadata: any): string | null {
  try {
    let m: any = metadata;

    if (typeof m === "string") {
      if (m.startsWith("gcm.v1.")) m = unseal(m);
      else if (m.trim().startsWith("{")) m = JSON.parse(m);
      else if (m.length > 40) return m; // looks like a token
    }

    if (m && typeof m === "object") {
      if (typeof m.access_token === "string") return m.access_token;
      if (typeof m.access === "string") return m.access;
      if (m.plaid && typeof m.plaid.access_token === "string") return m.plaid.access_token;
      if (typeof m.sealed === "string") {
        const inner = unseal(m.sealed);
        if (inner && typeof inner.access_token === "string") return inner.access_token;
      }
    }
  } catch {}
  return null;
}
