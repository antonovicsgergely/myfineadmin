import { unasRequest, extractXmlBlocks, extractXmlValue } from "../src/lib/unas/client";

async function check() {
  const getPageXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Params>
  <Format>xml</Format>
  <Page>
    <Id>930300</Id>
  </Page>
</Params>`;

  try {
    const res = await unasRequest("getPage", getPageXml);
    const existingContents = extractXmlBlocks(res, "Content");
    const existingIds = existingContents.map(c => extractXmlValue(c, "Id")).filter(Boolean) as string[];
    console.log("EXISTING IDS:", existingIds.length, existingIds);
  } catch (err) {
    console.error(err);
  }
}

check();
