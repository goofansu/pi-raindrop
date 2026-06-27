import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookmarkOperations } from "./index.ts";

function op(action: string) {
  const found = bookmarkOperations.find((operation) => operation.action === action);
  assert.ok(found, `missing operation ${action}`);
  return found;
}

describe("bookmark operations", () => {
  it("builds get_one", () => {
    const operation = op("get_one");
    assert.deepEqual(operation.validate({ action: "get_one", id: 123 }), { ok: true });
    assert.deepEqual(operation.buildRequest({ action: "get_one", id: 123 }), {
      method: "GET",
      path: "/raindrop/123",
    });
    assert.match(operation.format({ result: true, item: { _id: 123, title: "Example" } }), /Example/);
  });

  it("builds get_many with defaults and query fields", () => {
    const operation = op("get_many");
    assert.deepEqual(operation.buildRequest({ action: "get_many", search: "tag:docs", perpage: 25 }), {
      method: "GET",
      path: "/raindrops/0",
      query: { search: "tag:docs", perpage: 25 },
    });
  });

  it("rejects get_many perpage above 50", () => {
    const result = op("get_many").validate({ action: "get_many", perpage: 51 });
    assert.equal(result.ok, false);
    assert.match(result.reason, /perpage.*50/);
  });

  it("builds create_one", () => {
    const operation = op("create_one");
    const input = { action: "create_one", item: { link: "https://example.com", tags: ["docs"] } };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "POST",
      path: "/raindrop",
      body: { link: "https://example.com", tags: ["docs"] },
    });
  });

  it("rejects create_many with more than 100 items", () => {
    const result = op("create_many").validate({
      action: "create_many",
      items: Array.from({ length: 101 }, (_, i) => ({ link: `https://example.com/${i}` })),
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /100/);
  });

  it("builds update_one", () => {
    assert.deepEqual(op("update_one").buildRequest({ action: "update_one", id: 9, item: { title: "New" } }), {
      method: "PUT",
      path: "/raindrop/9",
      body: { title: "New" },
    });
  });

  it("rejects update_many collection 0", () => {
    const result = op("update_many").validate({ action: "update_many", collectionId: 0, body: { tags: ["x"] } });
    assert.equal(result.ok, false);
    assert.match(result.reason, /collectionId 0/);
  });

  it("builds update_many with query and body", () => {
    assert.deepEqual(op("update_many").buildRequest({
      action: "update_many",
      collectionId: 456,
      search: "tag:old",
      nested: true,
      body: { ids: [1, 2], tags: ["new"] },
    }), {
      method: "PUT",
      path: "/raindrops/456",
      query: { search: "tag:old", nested: true },
      body: { ids: [1, 2], tags: ["new"] },
    });
  });
});
