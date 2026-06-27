import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatBookmarkItem,
  formatCollectionItem,
  formatTagItem,
} from "./format.ts";

describe("format helpers", () => {
  it("formats bookmark fields used by list and single-item operations", () => {
    assert.equal(
      formatBookmarkItem({
        _id: 101,
        title: "Example",
        link: "https://example.com",
        tags: ["docs", "api", ""],
        excerpt: "Excerpt text",
        note: "Note text",
      }),
      [
        "Example",
        "   ID: 101",
        "   Link: https://example.com",
        "   Tags: docs, api",
        "   Excerpt: Excerpt text",
        "   Note: Note text",
      ].join("\n"),
    );
  });

  it("formats tag names with counts", () => {
    assert.equal(formatTagItem({ _id: "api", count: 100 }), "api (100)");
  });

  it("formats collection details", () => {
    assert.equal(
      formatCollectionItem({
        _id: 8492393,
        title: "Development",
        count: 16,
        public: false,
        view: "list",
        color: "#0c797d",
      }),
      [
        "Development",
        "   ID: 8492393",
        "   Count: 16",
        "   Visibility: private",
        "   View: list",
        "   Color: #0c797d",
      ].join("\n"),
    );
  });
});
