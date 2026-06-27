import type { RaindropOperation } from "../../core/types.ts";
import { formatCollections, ok } from "./helpers.ts";

export const get: RaindropOperation = {
  action: "get",
  validate() {
    return ok();
  },
  buildRequest() {
    return { method: "GET", path: "/collections" };
  },
  format(data) {
    const count = data.collections?.length ?? 0;
    return formatCollections(data, `Found ${count} collection(s).`);
  },
  summarize() {
    return "get all collections";
  },
};
