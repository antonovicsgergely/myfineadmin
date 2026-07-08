import prisma from "../prisma";
import { unasRequest, extractXmlBlocks, extractXmlValue, cdata } from "./client";

/**
 * Sync a single product TO UNAS (full data: name, description, price, images, categories, params, barcode, weight, status).
 */
export async function syncProductToUnas(productId: string): Promise<boolean> {
  const product = await prisma.productSync.findUnique({
    where: { id: productId },
    include: { vendor: true },
  });

  if (!product) throw new Error("A termék nem található.");

  try {
    // Look up UNAS category ID — REQUIRED by UNAS API
    let categoryXml = "";
    if (product.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
      if (category?.unasId) {
        categoryXml = `
          <Categories>
            <Category>
              <Id>${category.unasId}</Id>
              <Type>base</Type>
            </Category>
          </Categories>`;
      }
    }

    // If no category found, try to find ANY UNAS category as fallback
    if (!categoryXml) {
      const fallbackCategory = await prisma.category.findFirst({
        where: { unasId: { not: null }, isActive: true },
      });
      if (fallbackCategory?.unasId) {
        categoryXml = `
          <Categories>
            <Category>
              <Id>${fallbackCategory.unasId}</Id>
              <Type>base</Type>
            </Category>
          </Categories>`;
        console.warn(`[UNAS] Termék "${product.name}" — nincs kategória hozzárendelve, alapértelmezett használva: ${fallbackCategory.name}`);
      } else {
        // No UNAS categories exist at all — cannot sync
        console.error(`[UNAS] Termék "${product.name}" — nem szinkronizálható: nincs UNAS kategória a rendszerben! Futtasd először a Kategória szinkront.`);
        await prisma.productSync.update({
          where: { id: productId },
          data: { syncStatus: "ERROR" },
        });
        return false;
      }
    }

    // Build status flags
    const statusBase = product.statusActive ? (product.statusNew ? "2" : "1") : "0";

    // Build images
    const imageXml = product.imageUrl
      ? `<Images><Image><Url>${cdata(product.imageUrl)}</Url></Image></Images>`
      : "";

    // Build sale price if exists
    // Calculate net price from gross (27% ÁFA in Hungary)
    const vatRate = 1.27;
    const netPrice = Math.round(product.price / vatRate);

    let priceXml = `
      <Prices>
        <Price>
          <Type>normal</Type>
          <Net>${netPrice}</Net>
          <Gross>${product.price}</Gross>
        </Price>`;
    if (product.salePrice) {
      const saleNetPrice = Math.round(product.salePrice / vatRate);
      priceXml += `
        <Price>
          <Type>sale</Type>
          <Net>${saleNetPrice}</Net>
          <Gross>${product.salePrice}</Gross>
        </Price>`;
    }
    priceXml += `
      </Prices>`;

    // Build product parameters from filters JSON
    let paramsXml = "";
    if (product.filters) {
      try {
        const filters = JSON.parse(product.filters);
        if (Array.isArray(filters) && filters.length > 0) {
          paramsXml = "<Params>";
          for (const f of filters) {
            if (f.name && f.value) {
              paramsXml += `<Param><Name>${cdata(f.name)}</Name><Value>${cdata(f.value)}</Value></Param>`;
            }
          }
          paramsXml += "</Params>";
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    const action = product.unasProductId ? "modify" : "add";
    const idTag = product.unasProductId ? `<Id>${product.unasProductId}</Id>` : "";

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8" ?>
<Products>
  <Product>
    <Action>${action}</Action>
    ${idTag}
    <Sku>${cdata(product.itemNumber || product.id)}</Sku>
    <Name>${cdata(product.name)}</Name>
    <StatusBase>${statusBase}</StatusBase>
    <Weight>${product.weight || 0}</Weight>
    <Unit>${cdata("db")}</Unit>
    <Description>
      <Short>${cdata(product.shortDescription || "")}</Short>
      <Long>${cdata(product.description || "")}</Long>
    </Description>
    ${priceXml}
    ${categoryXml}
    ${imageXml}
    ${paramsXml}
    <Brand>${cdata(product.vendor?.brandName || product.vendor?.companyName || "Ismeretlen")}</Brand>
    ${product.barcode ? `<Barcode>${cdata(product.barcode)}</Barcode>` : ""}
  </Product>
</Products>`;

    const response = await unasRequest("setProduct", xmlPayload);
    console.log(`[UNAS] setProduct response for ${product.id}:`, response);

    // Extract the UNAS product ID from response
    const unasId = extractXmlValue(response, "Id");

    if (response.includes("<Status>ok</Status>") || (unasId && !response.includes("<Status>error</Status>"))) {
      await prisma.productSync.update({
        where: { id: product.id },
        data: {
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
          unasProductId: unasId || product.unasProductId,
        },
      });
      return true;
    } else {
      // Parse UNAS error message
      const unasError = extractXmlValue(response, "Error") || "Ismeretlen UNAS hiba";
      console.error(`[UNAS] Termék "${product.name}" szinkron hiba: ${unasError}`);
      throw new Error(`UNAS: ${unasError}`);
    }
  } catch (error: any) {
    console.error("[UNAS] Termék szinkron hiba:", error);

    await prisma.productSync.update({
      where: { id: productId },
      data: { syncStatus: "ERROR" },
    });

    return false;
  }
}

/**
 * Sync ALL approved products to UNAS.
 */
export async function syncAllProductsToUnas(): Promise<{ synced: number; failed: number; errors: string[] }> {
  const products = await prisma.productSync.findMany({
    where: { qualityStatus: "APPROVED" },
  });

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      const result = await syncProductToUnas(product.id);
      if (result) synced++;
      else {
        failed++;
        errors.push(`${product.name}: szinkron sikertelen`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`${product.name}: ${err.message}`);
    }
  }

  await prisma.syncLog.create({
    data: {
      type: "PRODUCTS",
      status: failed > 0 ? "ERROR" : "SUCCESS",
      message: `${synced} termék szinkronizálva, ${failed} sikertelen.`,
      itemCount: synced,
      details: errors.length > 0 ? JSON.stringify(errors) : null,
    },
  });

  return { synced, failed, errors };
}

/**
 * Delete a product from UNAS.
 */
export async function deleteProductFromUnas(unasProductId: string): Promise<boolean> {
  try {
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8" ?>
<Products>
  <Product>
    <Action>delete</Action>
    <Id>${unasProductId}</Id>
  </Product>
</Products>`;

    await unasRequest("setProduct", xmlPayload);
    return true;
  } catch (error) {
    console.error("[UNAS] Termék törlés hiba:", error);
    return false;
  }
}

/**
 * Sync products FROM UNAS → local database.
 * Pulls all active products and upserts them into ProductSync.
 */
export async function syncProductsFromUnas(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Request all active products from UNAS (full detail)
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <StatusBase>1</StatusBase>
  <ContentType>full</ContentType>
</Params>`;

    const response = await unasRequest("getProduct", xml);
    const productBlocks = extractXmlBlocks(response, "Product");

    if (productBlocks.length === 0) {
      return { synced: 0, errors: ["Nem találtunk aktív termékeket az UNAS-ban."] };
    }

    // Pre-load category mapping (unasId → local id)
    const categories = await prisma.category.findMany({ where: { unasId: { not: null } } });
    const categoryMap = new Map(categories.map(c => [c.unasId!, c.id]));

    // Pre-load vendors by brand name for matching
    const vendors = await prisma.vendor.findMany();
    const vendorByBrand = new Map<string, string>();
    for (const v of vendors) {
      if (v.brandName) vendorByBrand.set(v.brandName.toLowerCase(), v.id);
      vendorByBrand.set(v.companyName.toLowerCase(), v.id);
    }

    for (const block of productBlocks) {
      try {
        const unasProductId = extractXmlValue(block, "Id");
        const sku = extractXmlValue(block, "Sku");
        const name = extractXmlValue(block, "Name");

        if (!unasProductId || !name) {
          errors.push(`Hiányos termék adat: ID=${unasProductId}, Name=${name}`);
          continue;
        }

        // Extract prices
        const priceGross = parseFloat(extractXmlValue(block, "Gross") || "0");
        
        // Extract description
        const shortDesc = extractXmlValue(block, "Short") || null;
        const longDesc = extractXmlValue(block, "Long") || null;

        // Extract weight
        const weight = parseFloat(extractXmlValue(block, "Weight") || "0") || null;

        // Extract barcode
        const barcode = extractXmlValue(block, "Barcode") || null;

        // Extract brand and try to match to a vendor
        const brand = extractXmlValue(block, "Brand") || "";
        let vendorId: string | null = null;
        if (brand) {
          const matchedVendorId = vendorByBrand.get(brand.toLowerCase());
          if (matchedVendorId) {
            vendorId = matchedVendorId;
          }
        }
        
        // If vendorId is null, we set qualityStatus to PENDING so admin can assign it
        const qualityStatus = vendorId ? "APPROVED" : "PENDING";

        // Extract category ID
        let categoryId: string | null = null;
        const catBlocks = extractXmlBlocks(block, "Category");
        for (const catBlock of catBlocks) {
          const catId = extractXmlValue(catBlock, "Id") || catBlock.trim();
          if (catId && categoryMap.has(catId)) {
            categoryId = categoryMap.get(catId)!;
            break;
          }
        }

        // Extract image
        let imageUrl: string | null = null;
        const imageBlocks = extractXmlBlocks(block, "Image");
        if (imageBlocks.length > 0) {
          imageUrl = extractXmlValue(imageBlocks[0], "Url") || null;
        }

        // Upsert into local database
        await prisma.productSync.upsert({
          where: { unasProductId },
          update: {
            name,
            shortDescription: shortDesc,
            description: longDesc,
            price: priceGross || 0,
            weight,
            barcode,
            imageUrl,
            categoryId,
            itemNumber: sku,
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
            qualityStatus: qualityStatus,
          },
          create: {
            vendorId,
            unasProductId,
            name,
            shortDescription: shortDesc,
            description: longDesc,
            price: priceGross || 0,
            weight,
            barcode,
            imageUrl,
            categoryId,
            itemNumber: sku,
            uploadMethod: "UNAS_SYNC",
            syncStatus: "SYNCED",
            lastSyncedAt: new Date(),
            qualityStatus: qualityStatus,
          },
        });

        synced++;
      } catch (err: any) {
        const prodName = extractXmlValue(block, "Name") || "ismeretlen";
        errors.push(`${prodName}: ${err.message}`);
      }
    }

    await prisma.syncLog.create({
      data: {
        type: "PRODUCTS_IMPORT",
        status: errors.length > 0 ? "ERROR" : "SUCCESS",
        message: `${synced} termék importálva az UNAS-ból.${errors.length > 0 ? ` ${errors.length} hiba.` : ""}`,
        itemCount: synced,
        details: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });
  } catch (err: any) {
    errors.push(err.message);
    await prisma.syncLog.create({
      data: {
        type: "PRODUCTS_IMPORT",
        status: "ERROR",
        message: err.message,
        itemCount: 0,
      },
    });
  }

  return { synced, errors };
}
