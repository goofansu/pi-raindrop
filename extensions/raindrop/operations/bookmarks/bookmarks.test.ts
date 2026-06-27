import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ValidationResult } from "../../core/types.ts";
import { bookmarkOperations } from "./index.ts";

function op(action: string) {
  const found = bookmarkOperations.find(
    (operation) => operation.action === action,
  );
  assert.ok(found, `missing operation ${action}`);
  return found;
}

function assertInvalid(result: ValidationResult, pattern: RegExp) {
  assert.equal(result.ok, false);
  assert.match(result.reason, pattern);
}

describe("bookmark operations", () => {
  it("validates, maps, and formats get_one", () => {
    const operation = op("get_one");
    assert.deepEqual(operation.validate({ action: "get_one", id: 123 }), {
      ok: true,
    });
    assertInvalid(operation.validate({ action: "get_one" }), /requires id/);
    assert.deepEqual(operation.buildRequest({ action: "get_one", id: 123 }), {
      method: "GET",
      path: "/raindrop/123",
    });
    assert.match(
      operation.format({ result: true, item: { _id: 123, title: "Example" } }),
      /Found raindrop\.[\s\S]*Example/,
    );
  });

  it("validates, maps, and formats get_many", () => {
    const operation = op("get_many");
    assert.deepEqual(operation.validate({ action: "get_many", perpage: 25 }), {
      ok: true,
    });
    assertInvalid(
      operation.validate({ action: "get_many", perpage: 51 }),
      /perpage.*50/,
    );
    assertInvalid(
      operation.validate({ action: "get_many", perpage: "999" }),
      /perpage.*number/,
    );
    assert.deepEqual(
      operation.buildRequest({
        action: "get_many",
        search: "tag:docs",
        perpage: 25,
      }),
      {
        method: "GET",
        path: "/raindrops/0",
        query: { search: "tag:docs", perpage: 25 },
      },
    );
    assert.match(
      operation.format({
        result: true,
        items: [
          { _id: 1, title: "One" },
          { _id: 2, title: "Two" },
        ],
      }),
      /Found 2 raindrop\(s\)\.[\s\S]*1\. [\s\S]*One[\s\S]*2\. [\s\S]*Two/,
    );
  });

  it("validates, maps, and formats create_one", () => {
    const operation = op("create_one");
    const input = {
      action: "create_one",
      item: { link: "https://example.com", tags: ["docs"] },
    };
    assert.deepEqual(operation.validate(input), { ok: true });
    assertInvalid(
      operation.validate({ action: "create_one", item: {} }),
      /item\.link/,
    );
    assert.deepEqual(operation.buildRequest(input), {
      method: "POST",
      path: "/raindrop",
      body: { link: "https://example.com", tags: ["docs"] },
    });
    assert.match(
      operation.format({ result: true, item: { _id: 3, title: "Created" } }),
      /Created raindrop\.[\s\S]*Created/,
    );
  });

  it("validates, maps, and formats create_many", () => {
    const operation = op("create_many");
    assertInvalid(
      operation.validate({ action: "create_many", items: [] }),
      /at least 1 item/,
    );
    assertInvalid(
      operation.validate({
        action: "create_many",
        items: Array.from({ length: 101 }, (_, i) => ({
          link: `https://example.com/${i}`,
        })),
      }),
      /100/,
    );
    const input = {
      action: "create_many",
      items: [
        { link: "https://example.com/1" },
        { link: "https://example.com/2" },
      ],
    };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "POST",
      path: "/raindrops",
      body: {
        items: [
          { link: "https://example.com/1" },
          { link: "https://example.com/2" },
        ],
      },
    });
    assert.match(
      operation.format({
        result: true,
        items: [
          { _id: 1, title: "First" },
          { _id: 2, title: "Second" },
        ],
      }),
      /Created\/imported 2 raindrop\(s\)\.[\s\S]*1\. [\s\S]*First[\s\S]*2\. [\s\S]*Second/,
    );
  });

  it("validates, maps, and formats update_one", () => {
    const operation = op("update_one");
    assertInvalid(
      operation.validate({ action: "update_one", item: { title: "New" } }),
      /requires id/,
    );
    assertInvalid(
      operation.validate({ action: "update_one", id: 9 }),
      /requires item/,
    );
    assert.deepEqual(
      operation.validate({
        action: "update_one",
        id: 9,
        item: { title: "New" },
      }),
      { ok: true },
    );
    assert.deepEqual(
      operation.buildRequest({
        action: "update_one",
        id: 9,
        item: { title: "New" },
      }),
      {
        method: "PUT",
        path: "/raindrop/9",
        body: { title: "New" },
      },
    );
    assert.match(
      operation.format({ result: true, item: { _id: 9, title: "Updated" } }),
      /Updated raindrop\.[\s\S]*Updated/,
    );
  });

  it("validates, maps, and formats update_many", () => {
    const operation = op("update_many");
    assertInvalid(
      operation.validate({ action: "update_many", body: { tags: ["x"] } }),
      /requires collectionId/,
    );
    assertInvalid(
      operation.validate({ action: "update_many", collectionId: 456 }),
      /requires body/,
    );
    assertInvalid(
      operation.validate({
        action: "update_many",
        collectionId: 0,
        body: { tags: ["x"] },
      }),
      /collectionId 0/,
    );
    assert.deepEqual(
      operation.validate({
        action: "update_many",
        collectionId: 456,
        body: { tags: ["new"] },
      }),
      { ok: true },
    );
    assert.deepEqual(
      operation.buildRequest({
        action: "update_many",
        collectionId: 456,
        search: "tag:old",
        nested: true,
        body: { ids: [1, 2], tags: ["new"] },
      }),
      {
        method: "PUT",
        path: "/raindrops/456",
        query: { search: "tag:old", nested: true },
        body: { ids: [1, 2], tags: ["new"] },
      },
    );
    assert.equal(
      operation.format({ result: true, modified: 2 }),
      "Updated 2 raindrop(s).",
    );
  });
});
