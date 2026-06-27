import type { RaindropOperation } from "../../core/types.ts";
import { formatItems, query, validatePerpage } from "./helpers.ts";

export const getMany: RaindropOperation = {
  action: "get_many",
  validate: validatePerpage,
  buildRequest(input) {
    const collectionId =
      typeof input.collectionId === "number" ||
      typeof input.collectionId === "string"
        ? input.collectionId
        : 0;
    const request = {
      method: "GET" as const,
      path: `/raindrops/${collectionId}`,
      query: query(input, ["search", "sort", "page", "perpage", "nested"]),
    };
    if (!request.query) delete request.query;
    return request;
  },
  format(data) {
    const count = data.items?.length ?? 0;
    return formatItems(data, `Found ${count} raindrop(s).`);
  },
  summarize(input) {
    return `list raindrops in collection ${input.collectionId ?? 0}`;
  },
};
