import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email megadása kötelező!" }, { status: 400 });
    }

    // Ellenőrizzük, hogy létezik-e a felhasználó
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Biztonsági okokból nem áruljuk el, hogy létezik-e az email, mindig sikert adunk vissza
      return NextResponse.json({ message: "Ha az email cím regisztrálva van, elküldtük a visszaállítási linket." });
    }

    // Töröljük a korábbi tokeneket ehhez az emailhez
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Új token generálása
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 óra múlva lejár

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3050";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Itt kellene elküldeni a valódi emailt (Nodemailer-rel)
    // Mivel nincs SMTP adat megadva, kírjuk a konzolra a teszteléshez!
    console.log("=========================================");
    console.log("JELSZÓ VISSZAÁLLÍTÁS (MOCK EMAIL)");
    console.log(`Címzett: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log("=========================================");

    return NextResponse.json({ 
      message: "Ha az email cím regisztrálva van, elküldtük a visszaállítási linket.",
      mockLink: resetUrl
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Szerverhiba történt." }, { status: 500 });
  }
}
