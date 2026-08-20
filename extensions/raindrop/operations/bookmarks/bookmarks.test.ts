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
    const input = { action: "create_one", link: "https://example.com" };
    assert.deepEqual(operation.validate(input), { ok: true });
    assertInvalid(operation.validate({ action: "create_one" }), /link.*URL/);
    for (const link of [
      "example.com",
      "javascript:alert(1)",
      "tel:123",
      "data:text/html,x",
      "a:b",
    ]) {
      assertInvalid(
        operation.validate({ action: "create_one", link }),
        /link.*http\(s\) URL/,
      );
    }
    assertInvalid(
      operation.validate({
        action: "create_one",
        link: "https://example.com",
        item: { title: "Mine", tags: ["inbox"] },
      }),
      /item is not applied on create/,
    );
    assertInvalid(
      operation.validate({
        action: "create_one",
        link: "https://example.com",
        collectionId: 42,
      }),
      /collectionId is not applied on create/,
    );
    assert.deepEqual(operation.buildRequest(input), {
      method: "POST",
      path: "/raindrop",
      body: { link: "https://example.com", pleaseParse: {} },
    });
    assert.match(
      operation.format({ result: true, item: { _id: 3, title: "Created" } }),
      /Created raindrop\.[\s\S]*Created/,
    );
  });

  it("validates, maps, and formats create_many", () => {
    const operation = op("create_many");
    assertInvalid(
      operation.validate({ action: "create_many", links: [] }),
      /at least 1 link/,
    );
    assertInvalid(
      operation.validate({
        action: "create_many",
        links: Array.from(
          { length: 101 },
          (_, i) => `https://example.com/${i}`,
        ),
      }),
      /100/,
    );
    assertInvalid(
      operation.validate({
        action: "create_many",
        links: ["https://example.com/1", "nope"],
      }),
      /links\[1\].*URL/,
    );
    assertInvalid(
      operation.validate({
        action: "create_many",
        links: ["https://example.com/1", { link: "https://example.com/2" }],
      }),
      /links\[1\].*URL/,
    );
    assertInvalid(
      operation.validate({
        action: "create_many",
        links: ["https://example.com/1"],
        items: [{ link: "https://example.com/1", title: "Mine" }],
      }),
      /items is not applied on create/,
    );
    const input = {
      action: "create_many",
      links: ["https://example.com/1", "https://example.com/2"],
    };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "POST",
      path: "/raindrops",
      body: {
        items: [
          { link: "https://example.com/1", pleaseParse: {} },
          { link: "https://example.com/2", pleaseParse: {} },
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
    assertInvalid(
      operation.validate({
        action: "update_many",
        collectionId: 456,
        body: { tags: ["new"] },
      }),
      /ids or search/,
    );
    assert.deepEqual(
      operation.validate({
        action: "update_many",
        collectionId: 456,
        body: { ids: [1, 2], tags: ["new"] },
      }),
      { ok: true },
    );
    assert.deepEqual(
      operation.validate({
        action: "update_many",
        collectionId: 456,
        search: "tag:old",
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
