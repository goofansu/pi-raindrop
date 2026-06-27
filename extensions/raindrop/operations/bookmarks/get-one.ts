import type { RaindropOperation } from "../../core/types.ts";
import { formatItem, invalid, ok } from "./helpers.ts";

export const getOne: RaindropOperation = {
  action: "get_one",
  validate(input) {
    return typeof input.id === "number" || typeof input.id === "string"
      ? ok()
      : invalid("get_one requires id");
  },
  buildRequest(input) {
    return { method: "GET", path: `/raindrop/${input.id}` };
  },
  format(data) {
    return formatItem(data, "Found raindrop.");
  },
  summarize(input) {
    return `get raindrop ${input.id ?? "?"}`;
  },
};
