import type { RaindropOperation } from "../../core/types.ts";
import { formatTags, ok } from "./helpers.ts";

export const get: RaindropOperation = {
  action: "get",
  validate() {
    return ok();
  },
  buildRequest() {
    return { method: "GET", path: "/tags/0" };
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatTags(data, `Found ${count} tag(s).`);
  },
  summarize() {
    return "get all tags";
  },
};
