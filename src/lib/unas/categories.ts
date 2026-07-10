import prisma from "../prisma";
import { unasRequest, extractXmlBlocks, extractXmlValue } from "./client";

/**
 * Sync categories FROM UNAS → local database.
 * Pulls the full category tree and upserts into the Category table.
 */
export async function syncCategoriesFromUnas(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Request all categories from UNAS
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
</Params>`;

    const response = await unasRequest("getCategory", xml);
    const categoryBlocks = extractXmlBlocks(response, "Category");

    if (categoryBlocks.length === 0) {
      return { synced: 0, errors: ["Nem találtunk kategóriákat az UNAS-ban."] };
    }

    // First pass: collect all categories with their parent info
    const unasCategories: Array<{
      unasId: string;
      name: string;
      parentUnasId: string | null;
    }> = [];

    for (const block of categoryBlocks) {
      const id = extractXmlValue(block, "Id");
      const name = extractXmlValue(block, "Name");
      const parentBlock = extractXmlValue(block, "Parent");
      const parentId = parentBlock ? extractXmlValue(parentBlock, "Id") : null;

      if (!id || !name) {
        errors.push(`Hiányos kategória adat: ID=${id}, Name=${name}`);
        continue;
      }

      unasCategories.push({
        unasId: id,
        name: name.trim(),
        parentUnasId: parentId && parentId !== "0" ? parentId : null,
      });
    }

    // Second pass: upsert categories (parents first, then children)
    // Sort so that categories without parents come first
    const sorted = [...unasCategories].sort((a, b) => {
      if (!a.parentUnasId && b.parentUnasId) return -1;
      if (a.parentUnasId && !b.parentUnasId) return 1;
      return 0;
    });

    // Third pass: Filter to only include 'Termékek' (100001) and its descendants
    const ROOT_CATEGORY_ID = "100001";
    const validCategoryIds = new Set<string>();
    
    // Check if root exists
    const rootExists = unasCategories.some(c => c.unasId === ROOT_CATEGORY_ID);
    if (rootExists) {
      validCategoryIds.add(ROOT_CATEGORY_ID);
      
      let added = true;
      while (added) {
        added = false;
        for (const cat of unasCategories) {
          if (!validCategoryIds.has(cat.unasId) && cat.parentUnasId && validCategoryIds.has(cat.parentUnasId)) {
            validCategoryIds.add(cat.unasId);
            added = true;
          }
        }
      }
    }

    const filteredCategories = sorted.filter(c => validCategoryIds.has(c.unasId));

    for (const cat of filteredCategories) {
      let parentId: string | null = null;
      try {
        // Find parent's local ID if exists
        if (cat.parentUnasId) {
          const parentCat = await prisma.category.findUnique({
            where: { unasId: cat.parentUnasId },
          });
          parentId = parentCat?.id || null;
        }

        await prisma.category.upsert({
          where: { unasId: cat.unasId },
          update: {
            name: cat.name,
            parentId,
            isActive: true,
          },
          create: {
            unasId: cat.unasId,
            name: cat.name,
            parentId,
            isActive: true,
          },
        });
        synced++;
      } catch (err: any) {
        // Handle duplicate name — append UNAS ID to make unique
        if (err.code === "P2002" && err.meta?.target?.includes("name")) {
          try {
            await prisma.category.upsert({
              where: { unasId: cat.unasId },
              update: {
                name: `${cat.name} (${cat.unasId})`,
                isActive: true,
                parentId,
              },
              create: {
                unasId: cat.unasId,
                name: `${cat.name} (${cat.unasId})`,
                isActive: true,
                parentId,
              },
            });
            synced++;
          } catch (innerErr: any) {
            errors.push(`Kategória mentési hiba: ${cat.name} — ${innerErr.message}`);
          }
        } else {
          errors.push(`Kategória mentési hiba: ${cat.name} — ${err.message}`);
        }
      }
    }

    // Cleanup old categories that are not in the valid set
    if (validCategoryIds.size > 0) {
      await prisma.category.updateMany({
        where: { 
          OR: [
            { unasId: { notIn: Array.from(validCategoryIds) } },
            { unasId: null }
          ]
        },
        data: { isActive: false },
      });
    }

    // Log the sync
    await prisma.syncLog.create({
      data: {
        type: "CATEGORIES",
        status: errors.length > 0 ? "ERROR" : "SUCCESS",
        message: `${synced} kategória szinkronizálva.${errors.length > 0 ? ` ${errors.length} hiba.` : ""}`,
        itemCount: synced,
        details: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

  } catch (err: any) {
    errors.push(err.message);
    await prisma.syncLog.create({
      data: {
        type: "CATEGORIES",
        status: "ERROR",
        message: err.message,
        itemCount: 0,
      },
    });
  }

  return { synced, errors };
}
