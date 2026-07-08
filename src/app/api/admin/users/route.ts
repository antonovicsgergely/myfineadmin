import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        vendor: {
          select: {
            companyName: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { message: "Hiba a felhasználók lekérdezésekor." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const { name, email, role, password } = await req.json();

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { message: "Minden mező kitöltése kötelező!" },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json(
        { message: "Csak Admin vagy Szuperadmin szerepkör hozható létre innen." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Ezzel az email címmel már regisztráltak egy fiókot!" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return NextResponse.json(
      { message: "Új munkatárs fiókja sikeresen létrejött!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { message: "Hiba történt a felhasználó létrehozásakor." },
      { status: 500 }
    );
  }
}
