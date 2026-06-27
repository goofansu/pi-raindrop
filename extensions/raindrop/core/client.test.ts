import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRaindropClient, formatRaindropApiError } from "./client.ts";

describe("RaindropClient", () => {
  it("returns a tool-shaped error when API key is missing", async () => {
    const client = createRaindropClient(async () => new Response("{}"), "");
    const result = await client.request({
      method: "GET",
      path: "/collections",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "RAINDROP_API_KEY is not set");
  });

  it("sends bearer auth and parses JSON", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = createRaindropClient(async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(
        JSON.stringify({ result: true, items: [{ _id: 1 }] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }, "test-token");

    const result = await client.request({
      method: "GET",
      path: "/collections",
    });

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

    const result = await client.request({
      method: "GET",
      path: "/collections",
    });

    assert.equal(result.ok, false);
    assert.match(result.error, /Raindrop API failed: 401/);
    assert.doesNotMatch(JSON.stringify(result), /secret-token/);
  });

  it("returns an error result when fetch rejects", async () => {
    const client = createRaindropClient(async () => {
      throw new Error("network secret-token failed");
    }, "secret-token");

    const result = await client.request({
      method: "GET",
      path: "/collections",
    });

    assert.equal(result.ok, false);
    assert.match(result.error, /network \[REDACTED\] failed/);
    assert.doesNotMatch(JSON.stringify(result), /secret-token/);
  });

  it("returns an error result when success JSON is malformed", async () => {
    const client = createRaindropClient(
      async () => new Response("{not json", { status: 200 }),
      "test-token",
    );

    const result = await client.request({
      method: "GET",
      path: "/collections",
    });

    assert.equal(result.ok, false);
    assert.equal(result.status, 200);
    assert.match(result.error, /JSON|parse|Unexpected/i);
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
