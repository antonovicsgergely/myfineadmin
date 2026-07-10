/**
 * Közös validációs és sanitizálási segédfüggvények.
 * A rendszer egészében használhatók input ellenőrzésre és XSS megelőzésre.
 */

/** Maximális megengedett hosszak */
export const MAX_NAME_LENGTH = 255;
export const MAX_EMAIL_LENGTH = 320;
export const MAX_IMAGE_URL_LENGTH = 2048;

/** Fájlfeltöltési korlátok */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
]);

/**
 * E-mail cím formátum ellenőrzés (RFC 5322 egyszerűsített).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Ellenőrzi, hogy a kép URL biztonságos-e (belső feltöltés vagy HTTPS).
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.length === 0) return true; // üres = OK (nincs kép)
  if (url.length > MAX_IMAGE_URL_LENGTH) return false;
  // Belső feltöltés
  if (url.startsWith("/uploads/")) return true;
  // Csak HTTPS külső URL-ek
  if (url.startsWith("https://")) return true;
  return false;
}

/**
 * Szöveg sanitizálás: levágja, és korlátozza a hosszat.
 */
export function sanitizeString(input: string | null | undefined, maxLen: number = MAX_NAME_LENGTH): string {
  if (!input) return "";
  return input.trim().slice(0, maxLen);
}

/**
 * HTML speciális karakterek escape-elése XSS megelőzés céljából.
 * Az UNAS HTML generáláshoz használandó minden felhasználói inputon.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * CDATA-biztos szöveg: kiszűri a `]]>` szekvenciát,
 * ami CDATA blokkból való kitörést okozhat (XML injection).
 */
export function sanitizeCdata(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\]\]>/g, "]]&gt;");
}
