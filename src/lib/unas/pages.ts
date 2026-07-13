import { unasRequest, cdata, extractXmlValue, extractXmlBlocks } from "./client";
import prisma from "../prisma";
import { escapeHtml, sanitizeCdata } from "../validation";

export async function syncVendorPageToUnas(vendorId: string): Promise<string> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId }
  });

  if (!vendor) {
    throw new Error(`Vendor nem található: ${vendorId}`);
  }

  const brandTitle = vendor.brandName || vendor.companyName;
  if (!brandTitle) {
    throw new Error(`A gyártónak nincs megadva se márkanév, se cégnév: ${vendorId}`);
  }

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["UNAS_MANUFAKTURAK_PAGE_ID", "UNAS_API_KEY"] } }
  });
  
  const parentPageId = settings.find(s => s.key === "UNAS_MANUFAKTURAK_PAGE_ID")?.value;
  
  if (!parentPageId) {
    throw new Error("Az UNAS 'Manufaktúrák' szülő oldal ID-ja nincs beállítva a Rendszerbeállításokban!");
  }

  let unasPageId = vendor.unasPageId; // This is now actually the PageContent ID
  
  const baseUrl = process.env.NEXTAUTH_URL || "https://myfine.hu";
  const getAbsoluteUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const absCoverUrl = getAbsoluteUrl(vendor.coverUrl);
  const absLogoUrl = getAbsoluteUrl(vendor.logoUrl);

  // 🔒 XSS megelőzés — minden felhasználói inputot escape-elünk a HTML-ben
  const safeBrandTitle = escapeHtml(brandTitle);
  const safeDescription = vendor.description || "";

  let htmlContent = `
    <div class="myfine-brand-page" style="font-family: inherit; max-width: 800px; margin: 0 auto;">
      ${absCoverUrl ? `<div class="cover-image" style="width: 100%; height: 300px; overflow: hidden; border-radius: 8px; margin-bottom: 20px;"><img src="${escapeHtml(absCoverUrl)}" style="width: 100%; height: 100%; object-fit: cover;" alt="Cover" /></div>` : ''}
      <div class="brand-header" style="display: flex; align-items: center; margin-bottom: 30px;">
        ${absLogoUrl ? `<img src="${escapeHtml(absLogoUrl)}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: contain; margin-right: 20px; border: 1px solid #eaeaea; background: #fff;" alt="Logo" />` : ''}
        <h1 style="margin: 0; font-size: 2rem; color: #333;">${safeBrandTitle}</h1>
      </div>
      <div class="brand-description" style="line-height: 1.6; color: #444; font-size: 1.1rem; white-space: pre-wrap;">
        ${safeDescription}
      </div>
    </div>
  `;
  
  htmlContent = htmlContent.replace(/src="\/uploads\//g, `src="${baseUrl}/uploads/`);

  // Hozzuk létre vagy frissítsük a tartalmat (PageContent)
  const imageXml = (absCoverUrl || absLogoUrl) 
    ? `\n    <Image>\n      <Lead><![CDATA[${absCoverUrl || absLogoUrl}]]></Lead>\n    </Image>` 
    : "";

  const contentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<PageContents>
  <PageContent>
    <Action>${unasPageId ? 'modify' : 'add'}</Action>
    ${unasPageId ? `<Id>${unasPageId}</Id>` : ''}
    <Title>${cdata(sanitizeCdata(brandTitle))}</Title>
    <Type>blog</Type>
    <Published>yes</Published>
    <HideDate>yes</HideDate>${imageXml}
    <BlogContent>
      <Lead><![CDATA[${sanitizeCdata(vendor.shortDescription || "")}]]></Lead>
      <Text>${cdata(sanitizeCdata(htmlContent))}</Text>
    </BlogContent>
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

  // Meglévő tartalom lista lekérése, hogy ne írjuk felül
  const getPageXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Format>xml</Format>
  <Page>
    <Id>${parentPageId}</Id>
  </Page>
</Params>`;

  let existingIds: string[] = [];
  try {
    const getPageResponse = await unasRequest("getPage", getPageXml);
    const pages = extractXmlBlocks(getPageResponse, "Page");
    
    for (const page of pages) {
      if (extractXmlValue(page, "Id") === parentPageId) {
        const contentsBlock = extractXmlValue(page, "Contents") || "";
        const existingContents = extractXmlBlocks(contentsBlock, "Content");
        existingIds = existingContents.map(c => extractXmlValue(c, "Id")).filter(Boolean) as string[];
        break;
      }
    }
  } catch (err) {
    console.error("Hiba a parent page lekérésekor:", err);
  }

  // Az új pageId-t is hozzávesszük (ha még nincs benne)
  const allIds = Array.from(new Set([...existingIds, unasPageId]));
  
  const contentsXml = allIds.map(id => `
      <Content>
        <Id>${id}</Id>
      </Content>`).join("");

  // Hozzárendelés a szülő oldalhoz (Manufaktúrák menü)
  const pageLinkXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Pages>
  <Page>
    <Action>modify</Action>
    <Id>${parentPageId}</Id>
    <Type>normal</Type>
    <Contents>${contentsXml}
    </Contents>
  </Page>
</Pages>`;

  await unasRequest("setPage", pageLinkXml);

  return unasPageId;
}

export async function syncBlogPostToUnas(blogId: string): Promise<string> {
  const blog = await prisma.blogPost.findUnique({
    where: { id: blogId },
    include: { vendor: true }
  });

  if (!blog) {
    throw new Error(`Blogbejegyzés nem található: ${blogId}`);
  }

  const title = blog.title || blog.draftTitle;
  if (!title) {
    throw new Error(`A blogbejegyzésnek nincs címe: ${blogId}`);
  }

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["UNAS_BLOG_PAGE_ID", "UNAS_API_KEY"] } }
  });
  
  const parentPageId = settings.find(s => s.key === "UNAS_BLOG_PAGE_ID")?.value;
  
  if (!parentPageId) {
    throw new Error("Az UNAS 'Blog' szülő oldal ID-ja nincs beállítva a Rendszerbeállításokban!");
  }

  let unasPageId = blog.unasPageId;
  
  const baseUrl = process.env.NEXTAUTH_URL || "https://myfine.hu";
  const getAbsoluteUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const authorName = blog.vendor ? (blog.vendor.brandName || blog.vendor.companyName) : "Myfine.hu";
  const coverUrl = getAbsoluteUrl(blog.coverUrl || blog.draftCoverUrl);
  const shortDesc = blog.shortDescription || blog.draftShortDescription;
  const isPublished = blog.status === "PUBLISHED" ? "yes" : "no";

  // 🔒 XSS megelőzés
  const safeTitle = escapeHtml(title);
  const safeAuthor = escapeHtml(authorName);
  const safeShortDesc = shortDesc ? escapeHtml(shortDesc) : "";
  
  let htmlContent = `
    <div class="myfine-blog-post" style="font-family: inherit; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333;">
      <div style="font-size: 0.9rem; color: #666; margin-bottom: 20px; margin-top: 10px;">
        Írta: <strong>${safeAuthor}</strong> | ${new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("hu-HU")}
      </div>
      <div class="blog-content" style="font-size: 1.1rem; white-space: pre-wrap;">
        ${blog.content || blog.draftContent || ""}
      </div>
    </div>
  `;
  
  htmlContent = htmlContent.replace(/src="\/uploads\//g, `src="${baseUrl}/uploads/`);

  const imageXml = coverUrl
    ? `\n    <Image>\n      <Lead><![CDATA[${coverUrl}]]></Lead>\n    </Image>`
    : "";

  const contentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<PageContents>
  <PageContent>
    <Action>${unasPageId ? 'modify' : 'add'}</Action>
    ${unasPageId ? `<Id>${unasPageId}</Id>` : ''}
    <Title>${cdata(sanitizeCdata(title))}</Title>${imageXml}
    <Type>blog</Type>
    <Published>${isPublished}</Published>
    <HideDate>yes</HideDate>
    <BlogContent>
      <Lead><![CDATA[${coverUrl ? `<img src="${escapeHtml(coverUrl)}" style="width: 100%; max-height: 450px; height: auto; object-fit: cover; border-radius: 12px; margin-bottom: 15px;" alt="${safeTitle}" />` : ''}<div style="font-size: 1.1rem; font-weight: 500; font-style: italic; color: #444;">${sanitizeCdata(safeShortDesc)}</div>]]></Lead>
      <Text>${cdata(sanitizeCdata(htmlContent))}</Text>
    </BlogContent>
  </PageContent>
</PageContents>`;

  const contentResponse = await unasRequest("setPageContent", contentXml);
  
  if (contentResponse.includes("<Status>error</Status>")) {
    const errorMsg = extractXmlValue(contentResponse, "ErrorMessage");
    throw new Error(`UNAS API Hiba a blog tartalom feltöltésekor: ${errorMsg}`);
  }

  // Save the new PageContent ID if it was created
  if (!unasPageId) {
    unasPageId = extractXmlValue(contentResponse, "Id");
    if (!unasPageId) {
      throw new Error(`Nem sikerült kinyerni az UNAS blog tartalom ID-t a válaszból: ${contentResponse}`);
    }
    
    // We update using Prisma. Any typing issue with unasPageId will be solved when Prisma client generates again
    await (prisma.blogPost as any).update({
      where: { id: blogId },
      data: { unasPageId }
    });
  }

  // Get existing parent page content to append ours
  const getPageXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Format>xml</Format>
  <Page>
    <Id>${parentPageId}</Id>
  </Page>
</Params>`;

  let existingIds: string[] = [];
  try {
    const getPageResponse = await unasRequest("getPage", getPageXml);
    const pages = extractXmlBlocks(getPageResponse, "Page");
    
    for (const page of pages) {
      if (extractXmlValue(page, "Id") === parentPageId) {
        const contentsBlock = extractXmlValue(page, "Contents") || "";
        const existingContents = extractXmlBlocks(contentsBlock, "Content");
        existingIds = existingContents.map(c => extractXmlValue(c, "Id")).filter(Boolean) as string[];
        break;
      }
    }
  } catch (err) {
    console.error("Hiba a parent blog page lekérésekor:", err);
  }

  const allIds = Array.from(new Set([...existingIds, unasPageId]));
  
  const contentsXml = allIds.map(id => `
      <Content>
        <Id>${id}</Id>
      </Content>`).join("");

  const pageLinkXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Pages>
  <Page>
    <Action>modify</Action>
    <Id>${parentPageId}</Id>
    <Type>normal</Type>
    <Contents>${contentsXml}
    </Contents>
  </Page>
</Pages>`;

  await unasRequest("setPage", pageLinkXml);

  return unasPageId;
}
