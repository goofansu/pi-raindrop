import type { RaindropOperation } from "../../core/types.ts";
import {
  formatMutation,
  invalid,
  isArray,
  ok,
  type TagInput,
} from "./helpers.ts";

export const rename: RaindropOperation = {
  action: "rename",
  validate(input: TagInput) {
    if (!isArray(input.tags) || input.tags.length !== 1) {
      return invalid("rename requires exactly one tag");
    }
    if (typeof input.replace !== "string") {
      return invalid("rename requires replace");
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
    const tagName =
      isArray(input.tags) && input.tags.length > 0
        ? String(input.tags[0])
        : "?";
    return `rename tag ${tagName} to ${input.replace ?? "?"}`;
  },
};
