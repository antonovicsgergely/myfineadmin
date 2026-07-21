import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blogs = await prisma.blogPost.findMany({
      where: {
        status: { in: ["PUBLISHED", "DRAFT", "PENDING_APPROVAL"] },
      },
      select: {
        id: true,
        title: true,
        draftTitle: true,
        status: true,
        publishedAt: true,
        vendor: {
          select: { companyName: true, brandName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blogs);
  } catch (error) {
    console.error("Hiba a blogok lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérdezni a blogokat." },
      { status: 500 }
    );
  }
}
