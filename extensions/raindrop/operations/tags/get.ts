import type { RaindropOperation } from "../../core/types.ts";
import { formatTags, ok, tagCollectionId } from "./helpers.ts";

export const get: RaindropOperation = {
  action: "get",
  validate() {
    return ok();
  },
  buildRequest(input) {
    return { method: "GET", path: `/tags/${tagCollectionId(input)}` };
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatTags(data, `Found ${count} tag(s).`);
  },
  summarize() {
    return "get all tags";
  },
};
