import { scrapeAnnex } from "./annex";
import { scrapeThs } from "./ths";

async function main() {
  const [annex, ths] = await Promise.all([scrapeAnnex(), scrapeThs()]);
  console.log(
    "Annex:",
    annex.length,
    "| buddy:",
    annex.filter((c) => c.requires_buddy).length,
    "| longhair:",
    annex.filter((c) => c.is_long_hair).length
  );
  console.log(
    "THS:",
    ths.length,
    "| on hold:",
    ths.filter((c) => c.is_on_hold).length,
    "| longhair:",
    ths.filter((c) => c.is_long_hair).length,
    "| available:",
    ths.filter((c) => !c.is_on_hold).length
  );
  if (annex[0]) console.log("Annex sample:", annex[0].name, annex[0].breed);
  if (ths.find((c) => !c.is_on_hold))
    console.log("THS sample:", ths.find((c) => !c.is_on_hold)?.name);
}

main().catch(console.error);
