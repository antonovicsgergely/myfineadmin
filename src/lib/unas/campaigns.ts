import prisma from "../prisma";
import { unasRequest, extractXmlValue, cdata } from "./client";

const VAT_RATE = 1.27; // 27% ÁFA

/**
 * Calculate the sale price for a product based on campaign item settings.
 */
function calculateSalePrice(
  originalPrice: number,
  discountType: string,
  discountValue: number
): number {
  switch (discountType) {
    case "PERCENTAGE":
      return Math.round(originalPrice * (1 - discountValue / 100));
    case "FIXED_AMOUNT":
      return Math.max(0, Math.round(originalPrice - discountValue));
    case "FIXED_PRICE":
      return Math.round(discountValue);
    default:
      return originalPrice;
  }
}

/**
 * Get all products affected by a campaign (resolving VENDOR and CATEGORY targets).
 * Returns an array of { product, campaignItem } pairs.
 */
async function getCampaignAffectedProducts(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { items: true },
  });

  if (!campaign) throw new Error("Kampány nem található.");

  const results: { product: any; campaignItem: any }[] = [];

  for (const item of campaign.items) {
    let products: any[] = [];

    if (item.targetType === "PRODUCT" && item.productId) {
      const product = await prisma.productSync.findUnique({
        where: { id: item.productId },
      });
      if (product && product.unasProductId) products = [product];
    } else if (item.targetType === "VENDOR" && item.vendorId) {
      products = await prisma.productSync.findMany({
        where: {
          vendorId: item.vendorId,
          qualityStatus: "APPROVED",
          unasProductId: { not: null },
        },
      });
    } else if (item.targetType === "CATEGORY" && item.categoryId) {
      // Get category and all children recursively
      const categoryIds = await getCategoryIdsRecursive(item.categoryId);
      products = await prisma.productSync.findMany({
        where: {
          categoryId: { in: categoryIds },
          qualityStatus: "APPROVED",
          unasProductId: { not: null },
        },
      });
    }

    for (const product of products) {
      results.push({ product, campaignItem: item });
    }
  }

  return { campaign, results };
}

/**
 * Get all category IDs recursively (including children).
 */
async function getCategoryIdsRecursive(categoryId: string): Promise<string[]> {
  const ids = [categoryId];
  const children = await prisma.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });
  for (const child of children) {
    const childIds = await getCategoryIdsRecursive(child.id);
    ids.push(...childIds);
  }
  return ids;
}

/**
 * Sync campaign sale prices TO UNAS.
 * Sets salePrice on all affected products via the UNAS setProduct API.
 */
export async function syncCampaignPricesToUnas(
  campaignId: string
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { campaign, results } = await getCampaignAffectedProducts(campaignId);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  // Build date XML for sale period
  const startDateStr = campaign.startDate
    ? formatUnasDate(campaign.startDate)
    : "";
  const endDateStr = campaign.endDate
    ? formatUnasDate(campaign.endDate)
    : "";

  for (const { product, campaignItem } of results) {
    try {
      // Check stock limit
      if (campaignItem.maxQuantity && campaignItem.soldQuantity >= campaignItem.maxQuantity) {
        console.log(`[CAMPAIGN] Készletkorlát elérve: ${product.name}, kihagyás.`);
        continue;
      }

      const salePrice = calculateSalePrice(
        product.price,
        campaignItem.discountType,
        campaignItem.discountValue
      );

      const saleNetPrice = Math.round(salePrice / VAT_RATE);

      // Build sale price XML with optional date range
      let saleDateXml = "";
      if (startDateStr) saleDateXml += `<StartDate>${startDateStr}</StartDate>`;
      if (endDateStr) saleDateXml += `<EndDate>${endDateStr}</EndDate>`;

      const xmlPayload = `<?xml version="1.0" encoding="UTF-8" ?>
<Products>
  <Product>
    <Action>modify</Action>
    <Id>${product.unasProductId}</Id>
    <Prices>
      <Price>
        <Type>sale</Type>
        <Net>${saleNetPrice}</Net>
        <Gross>${salePrice}</Gross>
        ${saleDateXml}
      </Price>
    </Prices>
  </Product>
</Products>`;

      const response = await unasRequest("setProduct", xmlPayload);

      if (
        response.includes("<Status>ok</Status>") ||
        !response.includes("<Status>error</Status>")
      ) {
        // Update local salePrice
        await prisma.productSync.update({
          where: { id: product.id },
          data: { salePrice },
        });
        synced++;
      } else {
        const unasError = extractXmlValue(response, "Error") || "Ismeretlen UNAS hiba";
        errors.push(`${product.name}: ${unasError}`);
        failed++;
      }
    } catch (err: any) {
      errors.push(`${product.name}: ${err.message}`);
      failed++;
    }
  }

  // Log sync
  await prisma.syncLog.create({
    data: {
      type: "CAMPAIGN_SYNC",
      status: failed > 0 ? "ERROR" : "SUCCESS",
      message: `Kampány "${campaign.name}": ${synced} termék akciós ára beállítva.${failed > 0 ? ` ${failed} sikertelen.` : ""}`,
      itemCount: synced,
      details: JSON.stringify({ campaignId, errors }),
    },
  });

  return { synced, failed, errors };
}

/**
 * Remove campaign sale prices from UNAS.
 * Resets salePrice on all affected products.
 */
export async function removeCampaignPricesFromUnas(
  campaignId: string
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const { campaign, results } = await getCampaignAffectedProducts(campaignId);

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const { product } of results) {
    try {
      // Remove sale price by setting it to 0
      const xmlPayload = `<?xml version="1.0" encoding="UTF-8" ?>
<Products>
  <Product>
    <Action>modify</Action>
    <Id>${product.unasProductId}</Id>
    <Prices>
      <Price>
        <Type>sale</Type>
        <Net>0</Net>
        <Gross>0</Gross>
      </Price>
    </Prices>
  </Product>
</Products>`;

      const response = await unasRequest("setProduct", xmlPayload);

      if (
        response.includes("<Status>ok</Status>") ||
        !response.includes("<Status>error</Status>")
      ) {
        // Clear local salePrice
        await prisma.productSync.update({
          where: { id: product.id },
          data: { salePrice: null },
        });
        synced++;
      } else {
        const unasError = extractXmlValue(response, "Error") || "Ismeretlen UNAS hiba";
        errors.push(`${product.name}: ${unasError}`);
        failed++;
      }
    } catch (err: any) {
      errors.push(`${product.name}: ${err.message}`);
      failed++;
    }
  }

  // Log sync
  await prisma.syncLog.create({
    data: {
      type: "CAMPAIGN_SYNC",
      status: failed > 0 ? "ERROR" : "SUCCESS",
      message: `Kampány "${campaign.name}": ${synced} termék akciós ára visszaállítva.${failed > 0 ? ` ${failed} sikertelen.` : ""}`,
      itemCount: synced,
      details: JSON.stringify({ campaignId, errors }),
    },
  });

  return { synced, failed, errors };
}

/**
 * Format a date for UNAS API (YYYY.MM.DD.)
 */
function formatUnasDate(date: Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}.`;
}
