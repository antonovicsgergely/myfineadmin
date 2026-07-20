import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncCampaignPricesToUnas, removeCampaignPricesFromUnas } from "@/lib/unas/campaigns";

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

    // Unas sync triggers (non-blocking — runs in background)
    let syncResult = null;
    try {
      if (newStatus === "ACTIVE") {
        // Élesítés: akciós árak beállítása az Unasban
        syncResult = await syncCampaignPricesToUnas(id);
        console.log(`[CAMPAIGN] Élesítés szinkron kész: ${syncResult.synced} sikeres, ${syncResult.failed} sikertelen`);
      } else if (newStatus === "PAUSED" || newStatus === "ENDED") {
        // Szüneteltetés/Lezárás: akciós árak visszaállítása
        syncResult = await removeCampaignPricesFromUnas(id);
        console.log(`[CAMPAIGN] Árak visszaállítva: ${syncResult.synced} sikeres, ${syncResult.failed} sikertelen`);
      }
    } catch (syncError) {
      console.error("[CAMPAIGN] Unas szinkron hiba (nem blokkolta a státuszváltást):", syncError);
    }

    return NextResponse.json({
      ...updatedCampaign,
      syncResult,
    });
  } catch (error) {
    console.error("Hiba a kampány státuszváltáskor:", error);
    return NextResponse.json({ error: "Nem sikerült módosítani a státuszt." }, { status: 500 });
  }
}


