import type { RaindropOperation } from "../../core/types.ts";
import {
  formatItem,
  invalid,
  isObject,
  ok,
  withDefaultParse,
} from "./helpers.ts";

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
    const item = isObject(input.item) ? input.item : {};
    return {
      method: "POST",
      path: "/raindrop",
      body: withDefaultParse(item),
    };
  },
  format(data) {
    return formatItem(data, "Created raindrop.");
  },
  summarize() {
    return "create raindrop";
  },
};
