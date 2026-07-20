import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncCampaignPricesToUnas, removeCampaignPricesFromUnas } from "@/lib/unas/campaigns";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Kampány nem található." }, { status: 404 });
    }

    if (campaign.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Csak aktív kampány szinkronizálható. Jelenlegi státusz: " + campaign.status },
        { status: 400 }
      );
    }

    const result = await syncCampaignPricesToUnas(id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Hiba a kampány szinkronizálásakor:", error);
    return NextResponse.json(
      { error: "Nem sikerült szinkronizálni a kampányt." },
      { status: 500 }
    );
  }
}
