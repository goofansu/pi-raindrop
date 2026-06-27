import type { RaindropOperation } from "../../core/types.ts";
import { formatItem, invalid, isObject, ok } from "./helpers.ts";

export const updateOne: RaindropOperation = {
  action: "update_one",
  validate(input) {
    if (typeof input.id !== "number" && typeof input.id !== "string")
      return invalid("update_one requires id");
    if (!isObject(input.item)) return invalid("update_one requires item");
    return ok();
  },
  buildRequest(input) {
    return { method: "PUT", path: `/raindrop/${input.id}`, body: input.item };
  },
  format(data) {
    return formatItem(data, "Updated raindrop.");
  },
  summarize(input) {
    return `update raindrop ${input.id ?? "?"}`;
  },
};
