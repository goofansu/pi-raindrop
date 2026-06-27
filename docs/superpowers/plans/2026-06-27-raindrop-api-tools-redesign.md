# Raindrop API Tools Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `raindrop` command-router tool with three resource-shaped Raindrop tools backed by operation modules and an included agent skill.

**Architecture:** Build deep modules around three seams: `RaindropClient` for HTTP, `RaindropOperation` for endpoint-specific behavior, and `registerResourceTool` for Pi tool registration/action dispatch. Public tools are `raindrop_bookmarks`, `raindrop_tags`, and `raindrop_collections`; endpoint behavior stays local in operation files.

**Tech Stack:** TypeScript ESM, Node test runner, TypeBox schemas, `@earendil-works/pi-coding-agent` extension APIs, `@earendil-works/pi-ai` `StringEnum`, `@earendil-works/pi-tui` `Text`.

## Global Constraints

- No backward compatibility with the old `raindrop` tool is required.
- Register exactly three public tools: `raindrop_bookmarks`, `raindrop_tags`, and `raindrop_collections`.
- Do not add bookmark deletion/removal actions.
- Do not add file upload, cover upload, cache, or suggest actions.
- Do not add explicit `pi` metadata to `package.json`; Pi discovers `extensions/` and `skills/` by convention.
- `create_many` accepts 1 to 100 items.
- `update_many` rejects `collectionId: 0`.
- `perpage` must not exceed 50.
- Use TDD: write failing tests, run them, implement, then run verification.

---

## File Structure

Create focused files with one responsibility:

- `extensions/raindrop/core/types.ts`: shared TypeScript types for requests, responses, operation definitions, validation, and tool details.
- `extensions/raindrop/core/schemas.ts`: shared TypeBox schemas for collection refs, bookmark items, query fields, update bodies, and action-specific resource parameters.
- `extensions/raindrop/core/client.ts`: authenticated Raindrop HTTP module.
- `extensions/raindrop/core/format.ts`: shared bookmark, tag, and collection text formatting helpers.
- `extensions/raindrop/core/render.ts`: shared Pi TUI rendering helpers.
- `extensions/raindrop/core/resource-tool.ts`: generic resource tool registration and action dispatch.
- `extensions/raindrop/operations/bookmarks/*.ts`: six bookmark operation modules plus `index.ts`.
- `extensions/raindrop/operations/tags/*.ts`: four tag operation modules plus `index.ts`.
- `extensions/raindrop/operations/collections/get.ts` and `index.ts`: collection operation.
- `extensions/raindrop/index.ts`: extension entrypoint only; registers session warning and three resource tools.
- `skills/raindrop/SKILL.md`: agent guidance for the three tools.
- `README.md`: user-facing documentation for install/configuration/tools.

Existing `extensions/raindrop/index.ts` and `extensions/raindrop/index.test.ts` should be replaced rather than grown.

---

### Task 1: Core types, schemas, client, and format helpers

**Files:**
- Create: `extensions/raindrop/core/types.ts`
- Create: `extensions/raindrop/core/schemas.ts`
- Create: `extensions/raindrop/core/client.ts`
- Create: `extensions/raindrop/core/format.ts`
- Test: `extensions/raindrop/core/client.test.ts`
- Test: `extensions/raindrop/core/format.test.ts`

**Interfaces:**
- Produces: `RaindropRequest`, `RaindropOperation`, `ValidationResult`, `RaindropToolDetails`, `RaindropClient`, `createRaindropClient(fetchImpl?, apiKey?)`, `formatBookmarkItem`, `formatTagItem`, `formatCollectionItem`, shared schemas.
- Consumes: current project dependencies only.

- [ ] **Step 1: Write failing client tests**

Create `extensions/raindrop/core/client.test.ts` with tests for missing API key, bearer auth, JSON parsing, API error formatting, and secret redaction:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRaindropClient, formatRaindropApiError } from "./client.ts";

describe("RaindropClient", () => {
  it("returns a tool-shaped error when API key is missing", async () => {
    const client = createRaindropClient(async () => new Response("{}"), "");
    const result = await client.request({ method: "GET", path: "/collections" });

    assert.equal(result.ok, false);
    assert.equal(result.error, "RAINDROP_API_KEY is not set");
  });

  it("sends bearer auth and parses JSON", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = createRaindropClient(async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ result: true, items: [{ _id: 1 }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }, "test-token");

    const result = await client.request({ method: "GET", path: "/collections" });

    assert.equal(result.ok, true);
    assert.deepEqual(result.data, { result: true, items: [{ _id: 1 }] });
    assert.equal(calls[0].url, "https://api.raindrop.io/rest/v1/collections");
    assert.deepEqual(calls[0].init.headers, {
      Accept: "application/json",
      Authorization: "Bearer test-token",
      "Content-Type": "application/json",
    });
  });

  it("redacts the API key from API error text", async () => {
    const client = createRaindropClient(
      async () => new Response("denied secret-token", { status: 401 }),
      "secret-token",
    );

    const result = await client.request({ method: "GET", path: "/collections" });

    assert.equal(result.ok, false);
    assert.match(result.error, /Raindrop API failed: 401/);
    assert.doesNotMatch(JSON.stringify(result), /secret-token/);
  });
});

describe("formatRaindropApiError", () => {
  it("truncates long response bodies to 500 characters", () => {
    const message = formatRaindropApiError(429, "x".repeat(700));

    assert.match(message, /Raindrop API failed: 429/);
    assert.match(message, /x{500}/);
    assert.doesNotMatch(message, /x{650}/);
  });
});
```

- [ ] **Step 2: Write failing format tests**

Create `extensions/raindrop/core/format.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatBookmarkItem, formatCollectionItem, formatTagItem } from "./format.ts";

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
```

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/core/client.test.ts extensions/raindrop/core/format.test.ts
```

Expected: FAIL with module-not-found errors for `client.ts` and `format.ts`.

- [ ] **Step 4: Implement core files**

Implement the exported interfaces exactly as used by the tests. `RaindropClient.request()` should return a discriminated union:

```ts
type RaindropClientResult =
  | { ok: true; status: number; data: RaindropApiResponse }
  | { ok: false; status?: number; error: string };
```

`RaindropRequest` should use a relative `path` such as `/collections` and optional `query` record; the client builds the absolute URL under `https://api.raindrop.io/rest/v1`.

- [ ] **Step 5: Run core tests**

Run:

```bash
node --import tsx --test extensions/raindrop/core/client.test.ts extensions/raindrop/core/format.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add extensions/raindrop/core

git commit -m "feat: add raindrop core modules"
```

---

### Task 2: Bookmark operation modules

**Files:**
- Create: `extensions/raindrop/operations/bookmarks/get-one.ts`
- Create: `extensions/raindrop/operations/bookmarks/get-many.ts`
- Create: `extensions/raindrop/operations/bookmarks/create-one.ts`
- Create: `extensions/raindrop/operations/bookmarks/create-many.ts`
- Create: `extensions/raindrop/operations/bookmarks/update-one.ts`
- Create: `extensions/raindrop/operations/bookmarks/update-many.ts`
- Create: `extensions/raindrop/operations/bookmarks/index.ts`
- Test: `extensions/raindrop/operations/bookmarks/bookmarks.test.ts`

**Interfaces:**
- Consumes: `RaindropOperation`, `ValidationResult`, `RaindropRequest`, `formatBookmarkItem` from Task 1.
- Produces: `bookmarkOperations: RaindropOperation[]` with actions `get_one`, `get_many`, `create_one`, `create_many`, `update_one`, `update_many`.

- [ ] **Step 1: Write failing bookmark operation tests**

Create tests that verify validation, request mapping, and formatting for all six actions:

```ts
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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/operations/bookmarks/bookmarks.test.ts
```

Expected: FAIL with module-not-found error for `operations/bookmarks/index.ts`.

- [ ] **Step 3: Implement bookmark operations**

Implement each operation as a `RaindropOperation`. Use clear validation messages:

- `get_one requires id`
- `create_one requires item.link`
- `create_many requires at least 1 item`
- `create_many accepts at most 100 items`
- `update_one requires id`
- `update_one requires item`
- `update_many requires collectionId`
- `update_many does not support collectionId 0`
- `update_many requires body`
- `perpage must be at most 50`

Format strings:

- `get_one`: `Found raindrop.\n\n${formatBookmarkItem(item)}`
- `get_many`: `Found N raindrop(s).` plus numbered items
- `create_one`: `Created raindrop.\n\n${formatBookmarkItem(item)}`
- `create_many`: `Created/imported N raindrop(s).` plus numbered items when returned
- `update_one`: `Updated raindrop.\n\n${formatBookmarkItem(item)}`
- `update_many`: `Updated N raindrop(s).`

- [ ] **Step 4: Run bookmark tests**

Run:

```bash
node --import tsx --test extensions/raindrop/operations/bookmarks/bookmarks.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add extensions/raindrop/operations/bookmarks

git commit -m "feat: add bookmark operations"
```

---

### Task 3: Tag and collection operation modules

**Files:**
- Create: `extensions/raindrop/operations/tags/get.ts`
- Create: `extensions/raindrop/operations/tags/rename.ts`
- Create: `extensions/raindrop/operations/tags/merge.ts`
- Create: `extensions/raindrop/operations/tags/remove.ts`
- Create: `extensions/raindrop/operations/tags/index.ts`
- Create: `extensions/raindrop/operations/collections/get.ts`
- Create: `extensions/raindrop/operations/collections/index.ts`
- Test: `extensions/raindrop/operations/tags/tags.test.ts`
- Test: `extensions/raindrop/operations/collections/collections.test.ts`

**Interfaces:**
- Consumes: core types and format helpers from Task 1.
- Produces: `tagOperations: RaindropOperation[]`, `collectionOperations: RaindropOperation[]`.

- [ ] **Step 1: Write failing tests for tag operations**

Create `tags.test.ts` covering `get`, `rename`, `merge`, and `remove` request mapping and validation. Verify defaults use `/tags/0`, rename requires exactly one tag, merge requires `replace`, and remove requires tags.

- [ ] **Step 2: Write failing tests for collection operation**

Create `collections.test.ts` asserting `collections.get` builds `{ method: "GET", path: "/collections" }` and formats returned collections with title, ID, count, visibility, view, and color.

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/operations/tags/tags.test.ts extensions/raindrop/operations/collections/collections.test.ts
```

Expected: FAIL with module-not-found errors.

- [ ] **Step 4: Implement tag and collection operations**

Validation messages:

- `rename requires exactly one tag`
- `rename requires replace`
- `merge requires at least 1 tag`
- `merge requires replace`
- `remove requires at least 1 tag`

Format strings:

- tags get: `Found N tag(s).` plus numbered `name (count)` lines
- tags mutation: `Updated tag(s).`
- collections get: `Found N collection(s).` plus numbered collection summaries

- [ ] **Step 5: Run operation tests**

Run:

```bash
node --import tsx --test extensions/raindrop/operations/tags/tags.test.ts extensions/raindrop/operations/collections/collections.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add extensions/raindrop/operations/tags extensions/raindrop/operations/collections

git commit -m "feat: add tag and collection operations"
```

---

### Task 4: Resource tool factory and shared renderer

**Files:**
- Create: `extensions/raindrop/core/resource-tool.ts`
- Create: `extensions/raindrop/core/render.ts`
- Test: `extensions/raindrop/core/resource-tool.test.ts`

**Interfaces:**
- Consumes: `RaindropClient`, `RaindropOperation`, operation arrays from Tasks 2 and 3.
- Produces: `registerResourceTool(pi, definition, client?)` and shared rendering functions.

- [ ] **Step 1: Write failing resource tool tests**

Create tests with a fake `ExtensionAPI` that captures registered tools. Cover:

- registering one resource tool
- dispatching the correct operation by action
- returning validation errors with `isError: true`
- returning unknown action errors
- preserving result details: resource, action, endpoint, status, count, data
- rendering collapsed list results with an expand hint

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/core/resource-tool.test.ts
```

Expected: FAIL with module-not-found error for `resource-tool.ts`.

- [ ] **Step 3: Implement `registerResourceTool`**

`registerResourceTool` should call `pi.registerTool` with:

- `name`, `label`, `description`, `promptSnippet`, `promptGuidelines`, `parameters`
- `execute` that dispatches by `params.action`
- `renderCall` that uses the selected operation's `summarize(input)`
- `renderResult` that shows `✓` or `✗` and collapses long successful list output when not expanded

The execute path should:

1. Find operation by `action`.
2. Return `isError: true` for unknown action.
3. Validate input.
4. Build request.
5. Call client.
6. Return client error unchanged as a tool error.
7. Format data through operation.
8. Include structured details.

- [ ] **Step 4: Run resource tool tests**

Run:

```bash
node --import tsx --test extensions/raindrop/core/resource-tool.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all core and operation tests**

Run:

```bash
node --import tsx --test extensions/raindrop/core/*.test.ts extensions/raindrop/operations/**/*.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add extensions/raindrop/core/resource-tool.ts extensions/raindrop/core/render.ts extensions/raindrop/core/resource-tool.test.ts

git commit -m "feat: add raindrop resource tool factory"
```

---

### Task 5: Extension entrypoint and public tool registration

**Files:**
- Rewrite: `extensions/raindrop/index.ts`
- Rewrite: `extensions/raindrop/index.test.ts`

**Interfaces:**
- Consumes: `registerResourceTool`, `bookmarkOperations`, `tagOperations`, `collectionOperations`, schemas from prior tasks.
- Produces: extension default export registering exactly three public tools.

- [ ] **Step 1: Write failing registration tests**

Replace `extensions/raindrop/index.test.ts` with tests that assert:

- registered tool names equal `raindrop_bookmarks`, `raindrop_tags`, `raindrop_collections`
- no `raindrop` tool is registered
- session start warns when `RAINDROP_API_KEY` is missing
- each tool has prompt guidelines naming the tool explicitly
- bookmark tool execute can perform `create_one` using a fake fetch and bearer auth

- [ ] **Step 2: Run registration tests to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/index.test.ts
```

Expected: FAIL because current implementation registers the old `raindrop` tool.

- [ ] **Step 3: Rewrite `index.ts`**

Make `index.ts` an entrypoint only:

- import operation arrays
- import resource schemas
- create the shared client with default environment config
- register `session_start` warning for missing `RAINDROP_API_KEY`
- register three resource tools

Do not keep `validateRaindropParams`, `buildRaindropRequest`, or old command-router exports in `index.ts`.

- [ ] **Step 4: Run registration tests**

Run:

```bash
node --import tsx --test extensions/raindrop/index.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run lint:check
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add extensions/raindrop/index.ts extensions/raindrop/index.test.ts

git commit -m "feat: register raindrop resource tools"
```

---

### Task 6: Skill, README, and final verification

**Files:**
- Create: `skills/raindrop/SKILL.md`
- Modify: `README.md`
- Test: add skill existence assertions to `extensions/raindrop/index.test.ts` or create `skills/raindrop/skill.test.ts`

**Interfaces:**
- Consumes: public tool names/actions from Task 5.
- Produces: package-discovered skill and updated user documentation.

- [ ] **Step 1: Write failing skill existence test**

Add a Node test that reads `skills/raindrop/SKILL.md` and asserts it contains valid frontmatter with `name: raindrop` and mentions all three tools.

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
node --import tsx --test extensions/raindrop/index.test.ts
```

Expected: FAIL because `skills/raindrop/SKILL.md` does not exist.

- [ ] **Step 3: Create `skills/raindrop/SKILL.md`**

The skill must include:

```md
---
name: raindrop
description: Guidance for using pi-raindrop tools to find, create, update, and organize Raindrop.io bookmarks, tags, and collections. Use when working with Raindrop.io bookmarks or tags.
---

# Raindrop

Use these tools for Raindrop.io work:

- `raindrop_bookmarks` for bookmark get/create/update actions.
- `raindrop_tags` for tag listing, renaming, merging, and removal.
- `raindrop_collections` for discovering root collection IDs.

## Workflow guidance

- Use `raindrop_collections` with `{ "action": "get" }` when collection IDs are needed.
- Use `raindrop_bookmarks` with `{ "action": "get_many" }` before `update_many` unless the user gives an explicit query, IDs, or scope.
- Use `raindrop_bookmarks` with `{ "action": "update_one" }` when the user gives a bookmark ID.
- Use `raindrop_bookmarks` with `{ "action": "update_many" }` only with a non-zero `collectionId` and an intentional `search` or `ids` scope.
- Use `create_one` for one bookmark and `create_many` for 2 to 100 bookmarks.
- Use `raindrop_tags` only for tag management. Add or remove tags on bookmarks through bookmark create or update actions.
- Do not attempt bookmark deletion; this package version does not expose bookmark remove actions.
```

- [ ] **Step 4: Update README**

Document installation, `RAINDROP_API_KEY`, the three tools, actions, and two examples per tool category. State that Pi discovers both `extensions/` and `skills/` by convention and that no `pi` metadata is required.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm test
npm run typecheck
npm run lint:check
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/raindrop/SKILL.md README.md extensions/raindrop/index.test.ts

git commit -m "docs: add raindrop skill and usage docs"
```

---

## Self-Review

Spec coverage:

- Three public tools are covered in Tasks 4 and 5.
- Bookmark, tag, and collection endpoint operations are covered in Tasks 2 and 3.
- Deep module seams are covered in Tasks 1 and 4.
- Agent skill is covered in Task 6.
- Conventional package discovery without `pi` metadata is covered in Task 6 README guidance.
- Out-of-scope delete/upload/cache/suggest actions are excluded from all operation lists.

Verification:

- Each task has a failing-test step, implementation step, verification command, and commit step.
- Type consistency uses `RaindropOperation`, `RaindropRequest`, `RaindropClient`, and `registerResourceTool` consistently across tasks.
