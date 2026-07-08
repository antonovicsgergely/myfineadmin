import prisma from "../prisma";

const UNAS_API_BASE = "https://api.unas.eu/shop";

// Token cache — reusable until expiry
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Authenticate with UNAS API using API Key.
 * Returns a reusable Bearer token (cached until expiry).
 */
export async function getUnasToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: "UNAS_API_KEY" } });

  if (!apiKeySetting?.value) {
    throw new Error("Nincs beállítva az UNAS API kulcs a rendszerben! (Rendszerbeállítások → UNAS_API_KEY)");
  }

  const loginXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <ApiKey>${apiKeySetting.value}</ApiKey>
  <WebshopInfo>true</WebshopInfo>
</Params>`;

  const response = await fetch(`${UNAS_API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: loginXml,
  });

  const text = await response.text();

  const tokenMatch = text.match(/<Token>(.*?)<\/Token>/);
  const expireMatch = text.match(/<ExpireTime>(.*?)<\/ExpireTime>/);

  if (tokenMatch?.[1]) {
    cachedToken = tokenMatch[1];
    tokenExpiry = expireMatch?.[1] ? parseInt(expireMatch[1]) * 1000 : Date.now() + 3600000;
    console.log("[UNAS] Login sikeres, token megújítva.");
    return cachedToken;
  }

  console.error("[UNAS] Login válasz:", text);
  throw new Error("Sikertelen UNAS bejelentkezés — nem kaptunk tokent.");
}

/**
 * Send a POST request to an UNAS API endpoint.
 */
export async function unasRequest(endpoint: string, xmlBody: string): Promise<string> {
  const token = await getUnasToken();

  const response = await fetch(`${UNAS_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      "Authorization": `Bearer ${token}`,
    },
    body: xmlBody,
  });

  const text = await response.text();

  // For set* endpoints, UNAS returns error details in the XML body even on 400
  // We return the text so the caller can parse the error info
  if (!response.ok && response.status !== 400) {
    console.error(`[UNAS] ${endpoint} HTTP ${response.status}:`, text);
    throw new Error(`UNAS API hiba (${endpoint}): HTTP ${response.status}`);
  }

  return text;
}

/**
 * Extract all matches of a given XML tag from a response string.
 */
export function extractXmlValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "gs");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Extract a single XML tag value (first occurrence).
 */
export function extractXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
  return match ? match[1] : null;
}

/**
 * Extract all blocks of a repeating XML element.
 * e.g. extractXmlBlocks(xml, "Category") returns an array of "<Category>...</Category>" strings.
 */
export function extractXmlBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "gs");
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Wrap text in CDATA for XML safety.
 */
export function cdata(text: string): string {
  return `<![CDATA[${text || ""}]]>`;
}
