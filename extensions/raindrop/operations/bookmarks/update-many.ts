import type { RaindropOperation } from "../../core/types.ts";
import { invalid, isObject, ok, query } from "./helpers.ts";

export const updateMany: RaindropOperation = {
  action: "update_many",
  validate(input) {
    if (typeof input.collectionId !== "number")
      return invalid("update_many requires collectionId");
    if (input.collectionId === 0)
      return invalid("update_many does not support collectionId 0");
    if (!isObject(input.body)) return invalid("update_many requires body");
    return ok();
  },
  buildRequest(input) {
    const request = {
      method: "PUT" as const,
      path: `/raindrops/${input.collectionId}`,
      query: query(input, ["search", "nested"]),
      body: input.body,
    };
    if (!request.query) delete request.query;
    return request;
  },
  format(data) {
    return `Updated ${data.modified ?? 0} raindrop(s).`;
  },
  summarize(input) {
    return `update raindrops in collection ${input.collectionId ?? "?"}`;
  },
};
