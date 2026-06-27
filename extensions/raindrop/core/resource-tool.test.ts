import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Type } from "typebox";
import { registerResourceTool } from "./resource-tool.ts";
import type { RaindropClient, RaindropOperation } from "./types.ts";

interface RegisteredTool {
  name: string;
  label: string;
  description: string;
  promptSnippet: string;
  promptGuidelines: string[];
  parameters: unknown;
  execute(
    toolCallId: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<{
    isError: boolean;
    content: Array<{ type: "text"; text: string }>;
    details?: Record<string, unknown>;
  }>;
  renderCall(args: Record<string, unknown>, theme: TestTheme): { text: string };
  renderResult(
    result: {
      isError?: boolean;
      content: Array<{ type: "text"; text: string }>;
      details?: unknown;
    },
    options: { expanded: boolean },
    theme: TestTheme,
    context: { isError: boolean },
  ): { text: string };
}

interface TestTheme {
  fg(_name: string, text: string): string;
  bold(text: string): string;
}

const theme: TestTheme = {
  fg(_name, text) {
    return text;
  },
  bold(text) {
    return text;
  },
};

function makeOperation(
  action: string,
  overrides: Partial<RaindropOperation> = {},
): RaindropOperation {
  return {
    action,
    validate: () => ({ ok: true }),
    buildRequest: () => ({ method: "GET", path: `/api/${action}` }),
    format: (data) => `formatted ${action}: ${JSON.stringify(data)}`,
    summarize: () => `summary ${action}`,
    ...overrides,
  };
}

function registerForTest(
  operations: RaindropOperation[],
  client: RaindropClient,
): RegisteredTool {
  let tool: RegisteredTool | undefined;
  registerResourceTool(
    {
      registerTool(registeredTool: RegisteredTool) {
        tool = registeredTool;
      },
    } as never,
    {
      name: "raindrop_test",
      resource: "bookmarks",
      label: "Raindrop Test",
      description: "Test resource tool",
      promptSnippet: "Manage test resources",
      promptGuidelines: ["Use structured actions."],
      parameters: Type.Object({ action: Type.String() }),
      operations,
    },
    client,
  );
  assert.ok(tool);
  return tool;
}

describe("registerResourceTool", () => {
  it("registers one resource tool", () => {
    const tool = registerForTest([makeOperation("list")], {
      request: async () => ({ ok: true, status: 200, data: {} }),
    });

    assert.equal(tool.name, "raindrop_test");
    assert.equal(tool.label, "Raindrop Test");
    assert.equal(tool.description, "Test resource tool");
    assert.equal(tool.promptSnippet, "Manage test resources");
    assert.deepEqual(tool.promptGuidelines, ["Use structured actions."]);
    assert.ok(tool.parameters);
  });

  it("dispatches the correct operation by action", async () => {
    const calls: string[] = [];
    const tool = registerForTest(
      [
        makeOperation("first", {
          buildRequest: () => {
            calls.push("first");
            return { method: "GET", path: "/first" };
          },
        }),
        makeOperation("second", {
          buildRequest: () => {
            calls.push("second");
            return { method: "POST", path: "/second", body: { ok: true } };
          },
        }),
      ],
      {
        request: async (request) => ({
          ok: true,
          status: 201,
          data: { result: true, items: [request] },
        }),
      },
    );

    const result = await tool.execute("call-1", { action: "second" });

    assert.equal(result.isError, false);
    assert.deepEqual(calls, ["second"]);
    assert.equal(result.details?.action, "second");
    assert.equal(result.details?.endpoint, "POST /second");
  });

  it("returns validation errors with isError true", async () => {
    const tool = registerForTest(
      [
        makeOperation("list", {
          validate: () => ({ ok: false, reason: "missing collectionId" }),
        }),
      ],
      {
        request: async () => {
          throw new Error("must not call client");
        },
      },
    );

    const result = await tool.execute("call-1", { action: "list" });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /missing collectionId/);
    assert.equal(result.details?.error, "missing collectionId");
  });

  it("returns unknown action errors", async () => {
    const tool = registerForTest([makeOperation("list")], {
      request: async () => ({ ok: true, status: 200, data: {} }),
    });

    const result = await tool.execute("call-1", { action: "bogus" });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Unknown action: bogus/);
    assert.equal(result.details?.action, "bogus");
  });

  it("preserves result details: resource, action, endpoint, status, count, data", async () => {
    const data = { result: true, items: [{ _id: 1 }, { _id: 2 }] };
    const tool = registerForTest([makeOperation("list")], {
      request: async () => ({ ok: true, status: 200, data }),
    });

    const result = await tool.execute("call-1", { action: "list" });

    assert.equal(result.isError, false);
    assert.equal(result.details?.resource, "bookmarks");
    assert.equal(result.details?.action, "list");
    assert.equal(result.details?.endpoint, "GET /api/list");
    assert.equal(result.details?.status, 200);
    assert.equal(result.details?.count, 2);
    assert.deepEqual(result.details?.data, data);
  });

  for (const action of ["get_many", "get"]) {
    it(`renders collapsed ${action} results with an expand hint when count is greater than one`, () => {
      const tool = registerForTest([makeOperation(action)], {
        request: async () => ({ ok: true, status: 200, data: {} }),
      });

      const rendered = tool.renderResult(
        {
          isError: false,
          content: [
            {
              type: "text",
              text: "Found 2 raindrop(s).\n\n1. First\n2. Second",
            },
          ],
          details: { action, count: 2 },
        },
        { expanded: false },
        theme,
        { isError: false },
      );

      assert.match(rendered.text, /✓ bookmarks/);
      assert.match(rendered.text, /Found 2 raindrop\(s\)\./);
      assert.match(rendered.text, /to expand/);
      assert.doesNotMatch(rendered.text, /First/);
    });
  }

  it("renders call summaries using the selected operation", () => {
    const tool = registerForTest([makeOperation("list")], {
      request: async () => ({ ok: true, status: 200, data: {} }),
    });

    const rendered = tool.renderCall({ action: "list" }, theme);

    assert.match(rendered.text, /raindrop_test summary list/);
  });
});
