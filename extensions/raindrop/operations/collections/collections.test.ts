import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectionOperations } from "./index.ts";

function op(action: string) {
  const found = collectionOperations.find(
    (operation) => operation.action === action,
  );
  assert.ok(found, `missing operation ${action}`);
  return found;
}

describe("collection operations", () => {
  it("validates, maps, and formats get_collections", () => {
    const operation = op("get_collections");
    assert.deepEqual(operation.validate({ action: "get_collections" }), {
      ok: true,
    });
    assert.deepEqual(operation.buildRequest({ action: "get_collections" }), {
      method: "GET",
      path: "/collections",
    });
    assert.match(
      operation.format({
        result: true,
        items: [
          {
            _id: 123,
            title: "Bookmarks",
            count: 42,
            public: false,
            view: "grid",
            color: "#FF0000",
          },
          {
            _id: 456,
            title: "Reading List",
            count: 10,
            public: true,
            view: "list",
            color: "#0000FF",
          },
        ],
      }),
      /Found 2 collection\(s\)\.[\s\S]*1\. Bookmarks[\s\S]*2\. Reading List/,
    );
  });
});
