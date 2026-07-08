import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const { companyName, email, password } = await req.json();

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { message: "Minden mező kitöltése kötelező!" },
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

    // Kézi admin általi létrehozás: azonnal APPROVED
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: companyName, // Kapcsolattartó neve alapértelmezetten a cégnév
          email,
          password: hashedPassword,
          role: "VENDOR",
        },
      });

      await tx.vendor.create({
        data: {
          userId: newUser.id,
          companyName,
          status: "APPROVED",
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: "A gyártó sikeresen létrejött és azonnal jóváhagyásra került!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual vendor creation error:", error);
    return NextResponse.json(
      { message: "Hiba történt a gyártó létrehozásakor." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { companyName: "asc" }
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return NextResponse.json(
      { message: "Hiba a gyártók lekérdezésekor." },
      { status: 500 }
    );
  }
}
