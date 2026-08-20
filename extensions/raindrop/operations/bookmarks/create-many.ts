import type { RaindropOperation } from "../../core/types.ts";
import {
  formatItems,
  invalid,
  isObject,
  ok,
  withDefaultParse,
} from "./helpers.ts";

export const createMany: RaindropOperation = {
  action: "create_many",
  validate(input) {
    if (!Array.isArray(input.items) || input.items.length < 1)
      return invalid("create_many requires at least 1 item");
    if (input.items.length > 100)
      return invalid("create_many accepts at most 100 items");
    // Reject malformed entries rather than dropping them in buildRequest,
    // which would create fewer bookmarks than requested without an error.
    const bad = input.items.findIndex(
      (item) =>
        !isObject(item) || typeof item.link !== "string" || item.link === "",
    );
    if (bad !== -1)
      return invalid(`create_many requires items[${bad}].link to be a link`);
    return ok();
  },
  buildRequest(input) {
    const items = (Array.isArray(input.items) ? input.items : []).map((item) =>
      withDefaultParse(isObject(item) ? item : {}),
    );
    return { method: "POST", path: "/raindrops", body: { items } };
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatItems(data, `Created/imported ${count} raindrop(s).`);
  },
  summarize(input) {
    return `create ${Array.isArray(input.items) ? input.items.length : 0} raindrop(s)`;
  },
};
