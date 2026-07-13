import { NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import {
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_IMAGE_EXTENSIONS,
} from "@/lib/validation";

export async function POST(req: Request) {
  try {
    // 🔒 Auth ellenőrzés — csak bejelentkezett felhasználó tölthet fel
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nincs fájl kiválasztva." }, { status: 400 });
    }

    // 🔒 Fájlméret ellenőrzés
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: `A fájl mérete meghaladja a megengedett ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024} MB-ot.` },
        { status: 400 }
      );
    }

    // 🔒 MIME típus ellenőrzés
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Csak képfájlok (JPG, PNG, WebP, GIF) engedélyezettek." },
        { status: 400 }
      );
    }

    // 🔒 Kiterjesztés validálás — a nevet NEM használjuk, csak a kiterjesztést,
    //     és azt is csak whitelist-ből fogadjuk el
    const rawExt = path.extname(file.name || "").toLowerCase();
    const ext = ALLOWED_IMAGE_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";

    // 🔒 Biztonságos fájlnév generálás — crypto.randomUUID() nem kiszámítható
    const filename = `${crypto.randomUUID()}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 🔒 Magic bytes ellenőrzés — biztosítjuk, hogy a fájl tényleg kép
    if (!isImageBuffer(buffer)) {
      return NextResponse.json(
        { error: "A fájl tartalma nem érvényes képfájl." },
        { status: 400 }
      );
    }

    // Vercel Blob feltöltés a lokális mentés helyett
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Szerverhiba feltöltés közben." }, { status: 500 });
  }
}

/**
 * Ellenőrzi, hogy a buffer magic bytes-ai valóban képformátumra utalnak-e.
 * Megakadályozza, hogy átnevezett végrehajtható fájlokat tölthessenek fel.
 */
function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;

  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true;

  return false;
}
