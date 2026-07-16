import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "SUBSCRIPTION_CONDITIONS" },
    });

    return NextResponse.json({
      content: setting?.value || "A részletes kondíciók feltöltése folyamatban van.",
    });
  } catch (error) {
    console.error("Fetch conditions error:", error);
    return NextResponse.json({ error: "Hiba a kondíciók lekérdezése során" }, { status: 500 });
  }
}
