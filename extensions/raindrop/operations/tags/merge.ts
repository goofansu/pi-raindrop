import type { RaindropOperation } from "../../core/types.ts";
import {
  formatMutation,
  invalid,
  isArray,
  ok,
  type TagInput,
} from "./helpers.ts";

export const merge: RaindropOperation = {
  action: "merge",
  validate(input: TagInput) {
    if (!isArray(input.tags) || input.tags.length < 1) {
      return invalid("merge requires at least 1 tag");
    }
    if (typeof input.replace !== "string") {
      return invalid("merge requires replace");
    }
    return ok();
  },
  buildRequest(input: TagInput) {
    return {
      method: "PUT",
      path: "/tags/0",
      body: { tags: input.tags, replace: input.replace },
    };
  },
  format() {
    return formatMutation();
  },
  summarize(input: TagInput) {
    const tagList = isArray(input.tags) ? String(input.tags) : "[]";
    return `merge tags ${tagList} to ${input.replace ?? "?"}`;
  },
};
