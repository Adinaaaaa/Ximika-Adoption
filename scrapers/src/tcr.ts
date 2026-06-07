import type { CatRecord } from "@cat-matcher/shared";
import { fetchHtml, parsePortablePetList } from "./adoptapet-fetch";

const LIST_URL =
  "https://searchtools.adoptapet.com/cgi-bin/searchtools.cgi/portable_pet_list?shelter_id=75215&clan_name=cat&hide_clan_filter_p=1";

/** Toronto Cat Rescue — cats listed via Adopt-a-Pet shelter #75215. */
export async function scrapeTorontoCatRescue(): Promise<CatRecord[]> {
  const html = await fetchHtml(LIST_URL);
  return parsePortablePetList(html, "tcr", {
    shelter_name: "Toronto Cat Rescue",
    city: "Toronto",
    province: "ON",
    distance_km: 0,
  });
}
