import { PrismaClient } from "@prisma/client";
import { unasRequest, extractXmlBlocks, extractXmlValue, cdata } from "../src/lib/unas/client";

const prisma = new PrismaClient();

async function importUnasBlogs() {
  console.log("Starting UNAS Blog Import...");
  
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ["UNAS_BLOG_PAGE_ID"] } }
  });
  
  const blogPageId = settings.find(s => s.key === "UNAS_BLOG_PAGE_ID")?.value;
  if (!blogPageId) {
    console.error("No UNAS_BLOG_PAGE_ID setting found.");
    process.exit(1);
  }

  console.log(`Fetching all pages to find children of ${blogPageId}...`);
  
  const getPagesXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Action>get_all</Action>
</Params>`;

  let allPagesResponse;
  try {
    allPagesResponse = await unasRequest("getPage", getPagesXml);
  } catch (err) {
    console.error("Failed to fetch pages:", err);
    process.exit(1);
  }

  const pageBlocks = extractXmlBlocks(allPagesResponse, "Page");
  const blogPageIds: string[] = [];

  for (const block of pageBlocks) {
    const id = extractXmlValue(block, "Id");
    const parentId = extractXmlValue(block, "ParentId");
    const type = extractXmlValue(block, "Type");
    
    if (parentId === blogPageId || type === "blog") {
      if (id && id !== blogPageId) { // exclude the parent itself
        blogPageIds.push(id);
      }
    }
  }

  console.log(`Found ${blogPageIds.length} blog pages. Fetching contents...`);

  let importedCount = 0;

  for (const id of blogPageIds) {
    // Check if already exists
    const existing = await prisma.blogPost.findFirst({
      where: { unasPageId: id }
    });

    if (existing) {
      console.log(`Blog ${id} already exists in DB. Skipping.`);
      continue;
    }

    console.log(`Fetching content for page ${id}...`);
    
    const getContentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Id>${id}</Id>
</Params>`;

    try {
      const contentRes = await unasRequest("getPageContent", getContentXml);
      
      const contentBlock = extractXmlBlocks(contentRes, "PageContent")[0];
      if (!contentBlock) continue;

      const title = extractXmlValue(contentBlock, "Title");
      const text = extractXmlValue(contentBlock, "Text");
      const published = extractXmlValue(contentBlock, "Published");

      if (!title) continue;

      // Try to extract cover image and short description from text
      let coverUrl = "";
      let shortDescription = "";
      let cleanText = text || "";

      // Regex to find the first image
      const imgMatch = cleanText.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch) {
        coverUrl = imgMatch[1];
      }

      await prisma.blogPost.create({
        data: {
          title: title,
          content: cleanText,
          coverUrl: coverUrl || null,
          shortDescription: "UNAS Importált Bejegyzés",
          draftTitle: title,
          draftContent: cleanText,
          draftCoverUrl: coverUrl || null,
          draftShortDescription: "UNAS Importált Bejegyzés",
          status: published === "no" ? "INACTIVE" : "PUBLISHED",
          publishedAt: new Date(),
          unasPageId: id,
          vendorId: null // System blog
        }
      });

      console.log(`Imported: ${title}`);
      importedCount++;
    } catch (err) {
      console.error(`Failed to import page ${id}:`, err);
    }
  }

  console.log(`Import finished. Successfully imported ${importedCount} blogs.`);
}

importUnasBlogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
