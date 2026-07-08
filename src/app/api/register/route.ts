import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, companyName } = await req.json();

    if (!name || !email || !password || !companyName) {
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
        { message: "Ezzel az email címmel már regisztráltak!" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and vendor within a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "VENDOR",
        },
      });

      await tx.vendor.create({
        data: {
          userId: newUser.id,
          companyName,
          status: "PENDING", // Wait for admin approval
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: "Sikeres regisztráció! Fiókod adminisztrátori jóváhagyásra vár." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Hiba történt a regisztráció során." },
      { status: 500 }
    );
  }
}
