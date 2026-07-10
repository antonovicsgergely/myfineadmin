import { unasRequest } from "../src/lib/unas/client";

async function fix() {
  const pageLinkXml = `<?xml version="1.0" encoding="UTF-8" ?>
<Pages>
  <Page>
    <Action>modify</Action>
    <Id>930300</Id>
    <Type>blog</Type>
  </Page>
</Pages>`;

  try {
    const res = await unasRequest("setPage", pageLinkXml);
    console.log("FIX RESPONSE:", res);
  } catch (err) {
    console.error(err);
  }
}

fix();
