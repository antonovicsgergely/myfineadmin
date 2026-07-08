import prisma from "../prisma";
import { unasRequest, extractXmlBlocks, extractXmlValue } from "./client";

/**
 * Sync orders FROM UNAS → local database.
 * Pulls orders for a given date range and stores them locally with item-level vendor mapping.
 */
export async function syncOrdersFromUnas(
  dateStart?: string,
  dateEnd?: string
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    // Default to last 30 days if no range specified
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = dateStart || thirtyDaysAgo.toISOString().split("T")[0];
    const end = dateEnd || now.toISOString().split("T")[0];

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <DateStart>${start}</DateStart>
  <DateEnd>${end}</DateEnd>
</Params>`;

    const response = await unasRequest("getOrder", xml);
    const orderBlocks = extractXmlBlocks(response, "Order");

    if (orderBlocks.length === 0) {
      return { synced: 0, errors: [] };
    }

    for (const block of orderBlocks) {
      const unasOrderId = extractXmlValue(block, "Id") || extractXmlValue(block, "Key");
      if (!unasOrderId) {
        errors.push("Rendelés ID hiányzik");
        continue;
      }

      const status = extractXmlValue(block, "StatusName") || extractXmlValue(block, "Status") || "Ismeretlen";
      const customerName = extractXmlValue(block, "Name") || extractXmlValue(block, "CustomerName") || null;
      const customerEmail = extractXmlValue(block, "Email") || null;
      const totalGross = parseFloat(extractXmlValue(block, "TotalGross") || extractXmlValue(block, "Total") || "0");
      const totalNet = parseFloat(extractXmlValue(block, "TotalNet") || "0");
      const shippingMethod = extractXmlValue(block, "ShippingName") || extractXmlValue(block, "ShippingMethod") || null;
      const paymentMethod = extractXmlValue(block, "PaymentName") || extractXmlValue(block, "PaymentMethod") || null;
      const paymentStatus = extractXmlValue(block, "PaymentStatus") || null;
      const orderDateStr = extractXmlValue(block, "Date") || extractXmlValue(block, "OrderDate");
      const orderDate = orderDateStr ? new Date(orderDateStr) : new Date();

      try {
        // Upsert order
        const order = await prisma.order.upsert({
          where: { unasOrderId },
          update: {
            status,
            customerName,
            customerEmail,
            totalGross,
            totalNet,
            shippingMethod,
            paymentMethod,
            paymentStatus,
          },
          create: {
            unasOrderId,
            status,
            customerName,
            customerEmail,
            totalGross,
            totalNet,
            shippingMethod,
            paymentMethod,
            paymentStatus,
            orderDate,
          },
        });

        // Parse order items
        const itemBlocks = extractXmlBlocks(block, "Item");
        if (itemBlocks.length > 0) {
          // Delete existing items and re-create (simpler than individual upserts)
          await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

          for (const itemBlock of itemBlocks) {
            const sku = extractXmlValue(itemBlock, "Sku") || null;
            const productName = extractXmlValue(itemBlock, "Name") || "Ismeretlen termék";
            const quantity = parseInt(extractXmlValue(itemBlock, "Quantity") || extractXmlValue(itemBlock, "Qty") || "1");
            const unitPriceGross = parseFloat(extractXmlValue(itemBlock, "PriceGross") || extractXmlValue(itemBlock, "Price") || "0");
            const unitPriceNet = parseFloat(extractXmlValue(itemBlock, "PriceNet") || "0");
            const itemTotalGross = unitPriceGross * quantity;
            const itemTotalNet = unitPriceNet * quantity;
            const unasProductId = extractXmlValue(itemBlock, "Id") || extractXmlValue(itemBlock, "ProductId") || null;

            // Try to find our product + vendor by SKU or UNAS product ID
            let productSyncId: string | null = null;
            let vendorId: string | null = null;

            if (sku) {
              const localProduct = await prisma.productSync.findFirst({
                where: {
                  OR: [
                    { itemNumber: sku },
                    { id: sku },
                    { unasProductId: unasProductId || undefined },
                  ],
                },
              });
              if (localProduct) {
                productSyncId = localProduct.id;
                vendorId = localProduct.vendorId;
              }
            }

            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                sku,
                productName,
                quantity,
                unitPriceNet,
                unitPriceGross,
                totalNet: itemTotalNet,
                totalGross: itemTotalGross,
                unasProductId,
                productSyncId,
                vendorId,
              },
            });
          }
        }

        synced++;
      } catch (err: any) {
        errors.push(`Rendelés ${unasOrderId}: ${err.message}`);
      }
    }

    await prisma.syncLog.create({
      data: {
        type: "ORDERS",
        status: errors.length > 0 ? "ERROR" : "SUCCESS",
        message: `${synced} rendelés szinkronizálva (${start} – ${end}).${errors.length > 0 ? ` ${errors.length} hiba.` : ""}`,
        itemCount: synced,
        details: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });
  } catch (err: any) {
    errors.push(err.message);
    await prisma.syncLog.create({
      data: {
        type: "ORDERS",
        status: "ERROR",
        message: err.message,
        itemCount: 0,
      },
    });
  }

  return { synced, errors };
}
