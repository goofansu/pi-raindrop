import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ValidationResult } from "../../core/types.ts";
import { tagOperations } from "./index.ts";

function op(action: string) {
  const found = tagOperations.find((operation) => operation.action === action);
  assert.ok(found, `missing operation ${action}`);
  return found;
}

function assertInvalid(result: ValidationResult, pattern: RegExp) {
  assert.equal(result.ok, false);
  assert.match(result.reason, pattern);
}

describe("tag operations", () => {
  it("validates, maps, and formats get", () => {
    const operation = op("get");
    assert.deepEqual(operation.validate({ action: "get" }), { ok: true });
    assert.deepEqual(operation.buildRequest({ action: "get" }), {
      method: "GET",
      path: "/tags/0",
    });
    assert.deepEqual(
      operation.buildRequest({ action: "get", collectionId: 42 }),
      {
        method: "GET",
        path: "/tags/42",
      },
    );
    assert.match(
      operation.format({
        result: true,
        items: [
          { _id: "docs", count: 5 },
          { _id: "read-later", count: 3 },
        ],
      }),
      /Found 2 tag\(s\)\.[\s\S]*1\. docs \(5\)[\s\S]*2\. read-later \(3\)/,
    );
  });

  it("validates, maps, and formats rename", () => {
    const operation = op("rename");
    assertInvalid(
      operation.validate({ action: "rename", tags: [] }),
      /exactly one tag/,
    );
    assertInvalid(
      operation.validate({ action: "rename", tags: ["doc", "docs"] }),
      /exactly one tag/,
    );
    assertInvalid(
      operation.validate({ action: "rename", tags: ["doc"] }),
      /requires replace/,
    );
    assert.deepEqual(
      operation.buildRequest({
        action: "rename",
        tags: ["doc"],
        replace: "docs",
      }),
      {
        method: "PUT",
        path: "/tags/0",
        body: { tags: ["doc"], replace: "docs" },
      },
    );
    const input = {
      action: "rename",
      tags: ["doc"],
      replace: "docs",
      collectionId: 42,
    };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "PUT",
      path: "/tags/42",
      body: { tags: ["doc"], replace: "docs" },
    });
    assert.match(
      operation.format({ result: true, modified: 1 }),
      /Updated tag\(s\)\./,
    );
  });

  it("validates, maps, and formats merge", () => {
    const operation = op("merge");
    assertInvalid(
      operation.validate({ action: "merge", tags: [] }),
      /at least 1 tag/,
    );
    assertInvalid(
      operation.validate({ action: "merge", tags: ["old1"] }),
      /requires replace/,
    );
    assert.deepEqual(
      operation.buildRequest({
        action: "merge",
        tags: ["old1", "old2"],
        replace: "new",
      }),
      {
        method: "PUT",
        path: "/tags/0",
        body: { tags: ["old1", "old2"], replace: "new" },
      },
    );
    const input = {
      action: "merge",
      tags: ["old1", "old2"],
      replace: "new",
      collectionId: 42,
    };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "PUT",
      path: "/tags/42",
      body: { tags: ["old1", "old2"], replace: "new" },
    });
    assert.match(
      operation.format({ result: true, modified: 1 }),
      /Updated tag\(s\)\./,
    );
  });

  it("validates, maps, and formats remove", () => {
    const operation = op("remove");
    assertInvalid(
      operation.validate({ action: "remove", tags: [] }),
      /at least 1 tag/,
    );
    assert.deepEqual(
      operation.buildRequest({ action: "remove", tags: ["old"] }),
      {
        method: "DELETE",
        path: "/tags/0",
        body: { tags: ["old"] },
      },
    );
    const input = { action: "remove", tags: ["old"], collectionId: 42 };
    assert.deepEqual(operation.validate(input), { ok: true });
    assert.deepEqual(operation.buildRequest(input), {
      method: "DELETE",
      path: "/tags/42",
      body: { tags: ["old"] },
    });
    assert.match(
      operation.format({ result: true, modified: 1 }),
      /Updated tag\(s\)\./,
    );
  });
});
