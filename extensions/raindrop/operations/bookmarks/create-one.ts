import type { RaindropOperation } from "../../core/types.ts";
import { formatItem, invalid, isObject, ok } from "./helpers.ts";

export const createOne: RaindropOperation = {
  action: "create_one",
  validate(input) {
    return isObject(input.item) &&
      typeof input.item.link === "string" &&
      input.item.link !== ""
      ? ok()
      : invalid("create_one requires item.link");
  },
  buildRequest(input) {
    // Raindrop only fetches page metadata (title, excerpt, cover) when
    // pleaseParse is present; default it so new bookmarks are always parsed.
    const item = isObject(input.item) ? input.item : {};
    const pleaseParse = isObject(item.pleaseParse) ? item.pleaseParse : {};
    return {
      method: "POST",
      path: "/raindrop",
      body: { ...item, pleaseParse },
    };
  },
  format(data) {
    return formatItem(data, "Created raindrop.");
  },
  summarize() {
    return "create raindrop";
  },
};
