import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        items: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Hiba a kampányok lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérdezni a kampányokat." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await req.json();

    // Generate slug from name
    const slug = data.slug || data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        publicTitle: data.publicTitle || null,
        publicDescription: data.publicDescription || null,
        bannerImageUrl: data.bannerImageUrl || null,
        bannerLink: data.bannerLink || null,
        thumbnailUrl: data.thumbnailUrl || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        showOnHomeBanner: data.showOnHomeBanner || false,
        showInFeatured: data.showInFeatured || false,
        showInMenu: data.showInMenu || false,
        hasDedicatedPage: data.hasDedicatedPage || false,
        socialMediaText: data.socialMediaText || null,
        socialMediaImageUrl: data.socialMediaImageUrl || null,
        blogPostId: data.blogPostId || null,
        createdById: session?.user?.id || null,
      },
      include: {
        items: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error("Hiba a kampány létrehozásakor:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ez a slug már foglalt. Kérlek válassz másik nevet." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Nem sikerült létrehozni a kampányt." },
      { status: 500 }
    );
  }
}
