import { unasRequest, cdata, extractXmlValue } from "./client";
import prisma from "../prisma";

export async function syncVendorPageToUnas(vendorId: string): Promise<string> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId }
  });

  if (!vendor) {
    throw new Error(`Vendor nem található: ${vendorId}`);
  }

  if (!vendor.brandName) {
    throw new Error(`A gyártónak nincs megadva a márka neve: ${vendorId}`);
  }

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["UNAS_MANUFAKTURAK_PAGE_ID", "UNAS_API_KEY"] } }
  });
  
  const parentPageId = settings.find(s => s.key === "UNAS_MANUFAKTURAK_PAGE_ID")?.value;
  
  if (!parentPageId) {
    throw new Error("Az UNAS 'Manufaktúrák' szülő oldal ID-ja nincs beállítva a Rendszerbeállításokban!");
  }

  let unasPageId = vendor.unasPageId; // This is now actually the PageContent ID
  
  const htmlContent = `
    <div class="myfine-brand-page" style="font-family: inherit; max-width: 800px; margin: 0 auto;">
      ${vendor.coverUrl ? `<div class="cover-image" style="width: 100%; height: 300px; overflow: hidden; border-radius: 8px; margin-bottom: 20px;"><img src="${vendor.coverUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Cover" /></div>` : ''}
      <div class="brand-header" style="display: flex; align-items: center; margin-bottom: 30px;">
        ${vendor.logoUrl ? `<img src="${vendor.logoUrl}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: contain; margin-right: 20px; border: 1px solid #eaeaea; background: #fff;" alt="Logo" />` : ''}
        <h1 style="margin: 0; font-size: 2rem; color: #333;">${vendor.brandName}</h1>
      </div>
      <div class="brand-description" style="line-height: 1.6; color: #444; font-size: 1.1rem; white-space: pre-wrap;">
        ${vendor.description || ""}
      </div>
    </div>
  `;

  // Hozzuk létre vagy frissítsük a tartalmat (PageContent)
  const contentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<PageContents>
  <PageContent>
    <Action>${unasPageId ? 'modify' : 'add'}</Action>
    ${unasPageId ? `<Id>${unasPageId}</Id>` : ''}
    <Title>${cdata(vendor.brandName)}</Title>
    <Type>blog</Type>
    <BlogContent>
      <Lead><![CDATA[]]></Lead>
      <Text>${cdata(htmlContent)}</Text>
    </BlogContent>
    <Pages>
      <Page>
        <Id>${parentPageId}</Id>
      </Page>
    </Pages>
  </PageContent>
</PageContents>`;

  const contentResponse = await unasRequest("setPageContent", contentXml);
  
  if (contentResponse.includes("<Status>error</Status>")) {
    const errorMsg = extractXmlValue(contentResponse, "ErrorMessage");
    throw new Error(`UNAS API Hiba a tartalom feltöltésekor: ${errorMsg}`);
  }

  // Ha új volt, elmentjük az ID-t
  if (!unasPageId) {
    unasPageId = extractXmlValue(contentResponse, "Id");
    if (!unasPageId) {
      throw new Error(`Nem sikerült kinyerni az UNAS tartalom ID-t a válaszból: ${contentResponse}`);
    }
    
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { unasPageId }
    });
  }

  return unasPageId;
}
