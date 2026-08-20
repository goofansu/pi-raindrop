import type { RaindropOperation } from "../../core/types.ts";
import { formatItems, invalid, isObject, ok } from "./helpers.ts";

export const createMany: RaindropOperation = {
  action: "create_many",
  validate(input) {
    if (!Array.isArray(input.items) || input.items.length < 1)
      return invalid("create_many requires at least 1 item");
    if (input.items.length > 100)
      return invalid("create_many accepts at most 100 items");
    return ok();
  },
  buildRequest(input) {
    // Raindrop only fetches page metadata (title, excerpt, cover) when
    // pleaseParse is present; default it so new bookmarks are always parsed.
    const items = Array.isArray(input.items)
      ? input.items.filter(isObject).map((item) => ({
          ...item,
          pleaseParse: isObject(item.pleaseParse) ? item.pleaseParse : {},
        }))
      : [];
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
