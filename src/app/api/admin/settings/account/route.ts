import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidEmail, isValidImageUrl, sanitizeString, MAX_NAME_LENGTH } from "@/lib/validation";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 🔒 Pozitív allowlist — csak ADMIN és SUPERADMIN férhet hozzá
    if (
      !session?.user?.id ||
      (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = sanitizeString(body.name, MAX_NAME_LENGTH);
    const email = sanitizeString(body.email, 320);
    const image = body.image ? sanitizeString(body.image, 2048) : null;

    // 🔒 Input validáció
    if (!name || !email) {
      return NextResponse.json({ error: "Minden mező kitöltése kötelező!" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Érvénytelen e-mail cím formátum!" }, { status: 400 });
    }

    if (image && !isValidImageUrl(image)) {
      return NextResponse.json({ error: "Érvénytelen képcím formátum!" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: "Ez az e-mail cím már foglalt!" }, { status: 400 });
    }

    // 🔒 Csak a szükséges mezőket adjuk vissza (select), a password soha ne kerüljön a response-ba
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email, image },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    return NextResponse.json({ message: "Személyes profil sikeresen frissítve!", user: updatedUser });
  } catch (error) {
    console.error("Admin account update error:", error);
    return NextResponse.json(
      { error: "Hiba történt a profil frissítésekor." },
      { status: 500 }
    );
  }
}
