import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import raindropExtension from "./index.ts";

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
    content: Array<{ type: string; text: string }>;
    details?: Record<string, unknown>;
  }>;
}

type SessionStartHandler = (
  event: unknown,
  ctx: { ui: { notify(message: string, level: string): void } },
) => void;

function registerExtension() {
  const tools: RegisteredTool[] = [];
  const notifications: Array<{ message: string; level: string }> = [];
  let sessionStart: SessionStartHandler | undefined;

  raindropExtension({
    on(eventName: string, handler: SessionStartHandler) {
      if (eventName === "session_start") sessionStart = handler;
    },
    registerTool(tool: RegisteredTool) {
      tools.push(tool);
    },
  } as unknown as ExtensionAPI);

  sessionStart?.(null, {
    ui: {
      notify(message: string, level: string) {
        notifications.push({ message, level });
      },
    },
  });

  return { tools, notifications };
}

function toolByName(tools: RegisteredTool[], name: string): RegisteredTool {
  const tool = tools.find((candidate) => candidate.name === name);
  assert.ok(tool, `${name} should be registered`);
  return tool;
}

describe("raindrop extension registration", () => {
  it("registers exactly the three resource tools and not the legacy raindrop tool", () => {
    const { tools } = registerExtension();

    assert.deepEqual(
      tools.map((tool) => tool.name),
      ["raindrop_bookmarks", "raindrop_tags", "raindrop_collections"],
    );
    assert.equal(
      tools.some((tool) => tool.name === "raindrop"),
      false,
    );
  });

  it("warns at session start when RAINDROP_API_KEY is missing", () => {
    const oldValue = process.env.RAINDROP_API_KEY;
    delete process.env.RAINDROP_API_KEY;

    try {
      const { notifications } = registerExtension();

      assert.deepEqual(notifications, [
        {
          message:
            "raindrop: RAINDROP_API_KEY is not set - raindrop resource tools will fail.",
          level: "warning",
        },
      ]);
    } finally {
      if (oldValue === undefined) delete process.env.RAINDROP_API_KEY;
      else process.env.RAINDROP_API_KEY = oldValue;
    }
  });

  it("gives every tool prompt guidelines naming the tool explicitly", () => {
    const { tools } = registerExtension();

    for (const tool of tools) {
      assert.ok(
        tool.promptGuidelines.length > 0,
        `${tool.name} needs guidelines`,
      );
      assert.match(
        tool.promptGuidelines.join("\n"),
        new RegExp(tool.name),
        `${tool.name} guidelines should name the tool`,
      );
    }
  });

  it("bookmark tool execute can create_one using fetch and bearer auth", async () => {
    const oldKey = process.env.RAINDROP_API_KEY;
    const oldFetch = globalThis.fetch;
    const calls: Array<{ url: string; init: RequestInit }> = [];
    process.env.RAINDROP_API_KEY = "test-token";
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({ result: true, item: { _id: 101 } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    try {
      const { tools } = registerExtension();
      const bookmarks = toolByName(tools, "raindrop_bookmarks");
      const result = await bookmarks.execute("call-1", {
        action: "create_one",
        item: { link: "https://example.com", title: "Example" },
      });

      assert.equal(result.isError, false);
      assert.equal(calls[0].url, "https://api.raindrop.io/rest/v1/raindrop");
      assert.equal(calls[0].init.method, "POST");
      assert.deepEqual(calls[0].init.headers, {
        Accept: "application/json",
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
      });
      assert.equal(
        calls[0].init.body,
        JSON.stringify({ link: "https://example.com", title: "Example" }),
      );
    } finally {
      globalThis.fetch = oldFetch;
      if (oldKey === undefined) delete process.env.RAINDROP_API_KEY;
      else process.env.RAINDROP_API_KEY = oldKey;
    }
  });

  it("bookmark tool execute accepts partial item fields for update_one", async () => {
    const oldKey = process.env.RAINDROP_API_KEY;
    const oldFetch = globalThis.fetch;
    const calls: Array<{ url: string; init: RequestInit }> = [];
    process.env.RAINDROP_API_KEY = "test-token";
    globalThis.fetch = (async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({ result: true, item: { _id: 101, title: "New" } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    try {
      const { tools } = registerExtension();
      const bookmarks = toolByName(tools, "raindrop_bookmarks");
      const result = await bookmarks.execute("call-1", {
        action: "update_one",
        id: 101,
        item: { title: "New" },
      });

      assert.equal(result.isError, false);
      assert.equal(
        calls[0].url,
        "https://api.raindrop.io/rest/v1/raindrop/101",
      );
      assert.equal(calls[0].init.method, "PUT");
      assert.equal(calls[0].init.body, JSON.stringify({ title: "New" }));
    } finally {
      globalThis.fetch = oldFetch;
      if (oldKey === undefined) delete process.env.RAINDROP_API_KEY;
      else process.env.RAINDROP_API_KEY = oldKey;
    }
  });
});
