import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const UNAS_API_BASE = "https://api.unas.eu/shop";

async function main() {
  const apiKeySetting = await prisma.systemSetting.findUnique({ where: { key: "UNAS_API_KEY" } });
  
  const loginXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <ApiKey>${apiKeySetting.value}</ApiKey>
  <WebshopInfo>true</WebshopInfo>
</Params>`;

  let res = await fetch(`${UNAS_API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: loginXml,
  });
  let text = await res.text();
  const tokenMatch = text.match(/<Token>(.*?)<\/Token>/);
  const token = tokenMatch[1];

  const badIds = [3741576, 3741586, 3741601, 3741606, 3741611];
  
  for (const id of badIds) {
    const contentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<PageContents>
  <PageContent>
    <Action>delete</Action>
    <Id>${id}</Id>
  </PageContent>
</PageContents>`;

    res = await fetch(`${UNAS_API_BASE}/setPageContent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/xml",
        "Authorization": `Bearer ${token}`
      },
      body: contentXml,
    });
    text = await res.text();
    console.log(`Delete ${id}:`, text);
  }
}

main().finally(() => prisma.$disconnect());
