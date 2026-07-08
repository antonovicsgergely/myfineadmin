import prisma from "../prisma";
import { unasRequest, extractXmlBlocks, extractXmlValue } from "./client";

/**
 * Sync product parameters/filters FROM UNAS → local database.
 */
export async function syncParametersFromUnas(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
</Params>`;

    const response = await unasRequest("getProductParameter", xml);
    const paramBlocks = extractXmlBlocks(response, "Parameter");

    if (paramBlocks.length === 0) {
      // Try alternative block name
      const paramBlocks2 = extractXmlBlocks(response, "Param");
      if (paramBlocks2.length === 0) {
        return { synced: 0, errors: ["Nem találtunk paramétereket az UNAS-ban."] };
      }
      paramBlocks.push(...paramBlocks2);
    }

    for (const block of paramBlocks) {
      const id = extractXmlValue(block, "Id");
      const name = extractXmlValue(block, "Name");
      const type = extractXmlValue(block, "Type") || "LIST";

      if (!id || !name) {
        errors.push(`Hiányos paraméter adat: ID=${id}, Name=${name}`);
        continue;
      }

      // Extract possible values
      const valueBlocks = extractXmlBlocks(block, "Value");
      const values = valueBlocks.length > 0 ? JSON.stringify(valueBlocks) : null;

      try {
        await prisma.filter.upsert({
          where: { unasId: id },
          update: {
            name: name.trim(),
            type: type.toUpperCase(),
            values,
            isActive: true,
          },
          create: {
            unasId: id,
            name: name.trim(),
            type: type.toUpperCase(),
            values,
            isActive: true,
          },
        });
        synced++;
      } catch (err: any) {
        if (err.code === "P2002" && err.meta?.target?.includes("name")) {
          // Duplicate name — append UNAS ID
          try {
            await prisma.filter.upsert({
              where: { unasId: id },
              update: { name: `${name.trim()} (${id})`, type: type.toUpperCase(), values, isActive: true },
              create: { unasId: id, name: `${name.trim()} (${id})`, type: type.toUpperCase(), values, isActive: true },
            });
            synced++;
          } catch (innerErr: any) {
            errors.push(`Paraméter mentési hiba: ${name} — ${innerErr.message}`);
          }
        } else {
          errors.push(`Paraméter mentési hiba: ${name} — ${err.message}`);
        }
      }
    }

    await prisma.syncLog.create({
      data: {
        type: "PARAMETERS",
        status: errors.length > 0 ? "ERROR" : "SUCCESS",
        message: `${synced} paraméter szinkronizálva.${errors.length > 0 ? ` ${errors.length} hiba.` : ""}`,
        itemCount: synced,
        details: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });
  } catch (err: any) {
    errors.push(err.message);
    await prisma.syncLog.create({
      data: {
        type: "PARAMETERS",
        status: "ERROR",
        message: err.message,
        itemCount: 0,
      },
    });
  }

  return { synced, errors };
}
