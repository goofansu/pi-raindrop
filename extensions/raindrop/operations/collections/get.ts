import type { RaindropOperation } from "../../core/types.ts";
import { formatCollections, ok } from "./helpers.ts";

export const getCollections: RaindropOperation = {
  action: "get_collections",
  validate() {
    return ok();
  },
  buildRequest() {
    return { method: "GET", path: "/collections" };
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatCollections(data, `Found ${count} collection(s).`);
  },
  summarize() {
    return "get all collections";
  },
};
