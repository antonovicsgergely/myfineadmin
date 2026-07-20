import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["PAUSED", "ENDED"],
  PAUSED: ["ACTIVE", "ENDED"],
  ENDED: ["ARCHIVED"],
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status: newStatus } = await req.json();

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Kampány nem található." }, { status: 404 });
    }

    const validNextStatuses = VALID_TRANSITIONS[campaign.status];
    if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Nem váltható ${campaign.status} → ${newStatus}. Érvényes átmenetek: ${validNextStatuses?.join(", ") || "nincs"}.` },
        { status: 400 }
      );
    }

    // Check if campaign has items before activating
    if (newStatus === "ACTIVE") {
      const itemCount = await prisma.campaignItem.count({ where: { campaignId: id } });
      if (itemCount === 0) {
        return NextResponse.json(
          { error: "A kampányhoz legalább egy tételt kell hozzáadni az élesítés előtt." },
          { status: 400 }
        );
      }
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: newStatus },
      include: { items: true, createdBy: { select: { id: true, name: true, email: true } } },
    });

    // TODO: Phase 2 — Unas sync triggers
    // if (newStatus === "ACTIVE") → sync sale prices to Unas
    // if (newStatus === "PAUSED" || newStatus === "ENDED") → remove sale prices from Unas

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Hiba a kampány státuszváltáskor:", error);
    return NextResponse.json({ error: "Nem sikerült módosítani a státuszt." }, { status: 500 });
  }
}
