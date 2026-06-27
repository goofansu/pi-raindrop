import type { RaindropOperation } from "../../core/types.ts";
import { formatMutation, invalid, isArray, ok, type TagInput } from "./helpers.ts";

export const remove: RaindropOperation = {
  action: "remove",
  validate(input: TagInput) {
    if (!isArray(input.tags) || input.tags.length < 1) {
      return invalid("remove requires at least 1 tag");
    }
    return ok();
  },
  buildRequest(input: TagInput) {
    return {
      method: "DELETE",
      path: "/tags/0",
      body: { tags: input.tags },
    };
  },
  format() {
    return formatMutation();
  },
  summarize(input: TagInput) {
    const tagList = isArray(input.tags) ? String(input.tags) : "[]";
    return `remove tags ${tagList}`;
  },
};
