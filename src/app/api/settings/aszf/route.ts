import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "ASZF_DOC" },
    });

    return NextResponse.json({
      content: setting?.value || "Az Általános Szerződési Feltételek feltöltése folyamatban van.",
    });
  } catch (error) {
    console.error("Fetch ASZF error:", error);
    return NextResponse.json({ error: "Hiba az ÁSZF lekérdezése során" }, { status: 500 });
  }
}
