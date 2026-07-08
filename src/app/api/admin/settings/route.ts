import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const { settings } = await req.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json({ message: "Érvénytelen adatformátum" }, { status: 400 });
    }

    // Upsert mindegyik beállításra
    for (const setting of settings) {
      if (setting.key && setting.value !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: String(setting.value) },
          create: { key: setting.key, value: String(setting.value) },
        });
      }
    }

    return NextResponse.json({ message: "Beállítások sikeresen mentve!" }, { status: 200 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { message: "Hiba történt a beállítások mentésekor." },
      { status: 500 }
    );
  }
}
