import type { RaindropOperation } from "../../core/types.ts";
import {
  formatItems,
  invalid,
  isLink,
  ok,
  rejectCreateExtras,
} from "./helpers.ts";

export const createMany: RaindropOperation = {
  action: "create_many",
  validate(input) {
    if (!Array.isArray(input.links) || input.links.length < 1)
      return invalid("create_many requires at least 1 link");
    if (input.links.length > 100)
      return invalid("create_many accepts at most 100 links");
    // Reject bad links rather than dropping them in buildRequest, which would
    // create fewer bookmarks than requested without reporting an error.
    const bad = input.links.findIndex((link) => !isLink(link));
    if (bad !== -1)
      return invalid(`create_many requires links[${bad}] to be an http(s) URL`);
    return rejectCreateExtras(input, "create_many", "links") ?? ok();
  },
  buildRequest(input) {
    // pleaseParse is what makes Raindrop fetch the page metadata. Verified
    // against POST /raindrop, where it fills in title, excerpt, and cover
    // within seconds; this batch endpoint takes the same per-item format but
    // was not exercised. A bookmark is only ever a link, so always send it.
    // Omitting collection puts the bookmark in Unsorted, collection -1.
    const links = Array.isArray(input.links) ? input.links : [];
    return {
      method: "POST",
      path: "/raindrops",
      body: { items: links.map((link) => ({ link, pleaseParse: {} })) },
    };
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatItems(data, `Created/imported ${count} raindrop(s).`);
  },
  summarize(input) {
    return `create ${Array.isArray(input.links) ? input.links.length : 0} raindrop(s)`;
  },
};
