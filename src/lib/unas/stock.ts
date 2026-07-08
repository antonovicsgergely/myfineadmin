import { unasRequest, extractXmlValue, extractXmlBlocks, cdata } from "./client";

/**
 * Get stock level from UNAS for a given SKU.
 */
export async function getStockFromUnas(sku: string): Promise<number | null> {
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Sku>${sku}</Sku>
</Params>`;

    const response = await unasRequest("getStock", xml);
    const qty = extractXmlValue(response, "Qty");
    return qty ? parseInt(qty) : null;
  } catch (error) {
    console.error("[UNAS] Készlet lekérdezés hiba:", error);
    return null;
  }
}

/**
 * Update stock in UNAS.
 * @param action "in" = add stock, "out" = remove stock, "modify" = set absolute value
 */
export async function updateStockInUnas(
  sku: string,
  quantity: number,
  action: "in" | "out" | "modify" = "modify"
): Promise<boolean> {
  try {
    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<Products>
  <Product>
    <Action>${action}</Action>
    <Sku>${cdata(sku)}</Sku>
    <Stocks>
      <Stock>
        <Qty>${quantity}</Qty>
      </Stock>
    </Stocks>
  </Product>
</Products>`;

    const response = await unasRequest("setStock", xml);
    return response.includes("<Status>ok</Status>");
  } catch (error) {
    console.error("[UNAS] Készlet frissítés hiba:", error);
    return false;
  }
}
