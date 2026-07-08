import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Minden mező kitöltése kötelező!" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: "Ez az e-mail cím már foglalt!" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });

    return NextResponse.json({ message: "Személyes profil sikeresen frissítve!", user: updatedUser });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { error: "Hiba történt a profil frissítésekor." },
      { status: 500 }
    );
  }
}
