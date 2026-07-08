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

  const getPageContentXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Format>xml</Format>
</Params>`;

  res = await fetch(`${UNAS_API_BASE}/getPageContent`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/xml",
      "Authorization": `Bearer ${token}`
    },
    body: getPageContentXml,
  });
  text = await res.text();
  
  const fs = await import('fs');
  fs.writeFileSync('pageContents.xml', text);
  console.log("Wrote all page contents to pageContents.xml");
}

main().finally(() => prisma.$disconnect());
