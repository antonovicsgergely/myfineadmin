import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Hiányzó adatok!" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A jelszónak legalább 6 karakter hosszúnak kell lennie." }, { status: 400 });
    }

    // Megkeressük a tokent az adatbázisban
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Érvénytelen visszaállítási link." }, { status: 400 });
    }

    // Ellenőrizzük, hogy lejárt-e
    if (new Date() > resetToken.expires) {
      // Töröljük a lejárt tokent
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: "A visszaállítási link lejárt. Kérj újat!" }, { status: 400 });
    }

    // Titkosítjuk az új jelszót
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Frissítjük a felhasználó jelszavát
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Töröljük a már felhasznált tokent
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({ message: "Sikeres jelszómódosítás." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Szerverhiba történt." }, { status: 500 });
  }
}
