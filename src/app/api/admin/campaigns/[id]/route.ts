import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Kampány nem található." }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Hiba a kampány lekérdezésekor:", error);
    return NextResponse.json({ error: "Nem sikerült lekérdezni a kampányt." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        publicTitle: data.publicTitle ?? null,
        publicDescription: data.publicDescription ?? null,
        bannerImageUrl: data.bannerImageUrl ?? null,
        bannerLink: data.bannerLink ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        showOnHomeBanner: data.showOnHomeBanner ?? false,
        showInFeatured: data.showInFeatured ?? false,
        showInMenu: data.showInMenu ?? false,
        hasDedicatedPage: data.hasDedicatedPage ?? false,
        socialMediaText: data.socialMediaText ?? null,
        socialMediaImageUrl: data.socialMediaImageUrl ?? null,
        blogPostId: data.blogPostId ?? null,
      },
      include: {
        items: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Hiba a kampány módosításakor:", error);
    return NextResponse.json({ error: "Nem sikerült módosítani a kampányt." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Kampány nem található." }, { status: 404 });
    }
    if (campaign.status !== "DRAFT") {
      return NextResponse.json({ error: "Csak DRAFT státuszú kampány törölhető." }, { status: 400 });
    }

    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hiba a kampány törlésekor:", error);
    return NextResponse.json({ error: "Nem sikerült törölni a kampányt." }, { status: 500 });
  }
}
