import type { RaindropOperation } from "../../core/types.ts";
import {
  formatItem,
  invalid,
  isLink,
  ok,
  rejectCreateExtras,
} from "./helpers.ts";

export const createOne: RaindropOperation = {
  action: "create_one",
  validate(input) {
    if (!isLink(input.link))
      return invalid("create_one requires link to be an http(s) URL");
    return rejectCreateExtras(input, "create_one", "link") ?? ok();
  },
  buildRequest(input) {
    // pleaseParse is what makes Raindrop fetch the page metadata (verified:
    // it fills in title, excerpt, and cover within seconds). A bookmark is
    // only ever a link, so always send it. Omitting collection puts the
    // bookmark in Unsorted, collection -1.
    return {
      method: "POST",
      path: "/raindrop",
      body: { link: input.link, pleaseParse: {} },
    };
  },
  format(data) {
    return formatItem(data, "Created raindrop.");
  },
  summarize(input) {
    return `create raindrop ${typeof input.link === "string" ? input.link : "?"}`;
  },
};
