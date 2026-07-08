import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Lekérdezi az olvasatlan (vagy az összes legutóbbi) értesítéseket
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20 // Csak az utolsó 20-at hozzuk le
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Hiba az értesítések lekérésekor:", error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

// Olvasottá teszi az összes olvasatlan értesítést a felhasználónak
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hiba az értesítések olvasottá tételekor:", error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
