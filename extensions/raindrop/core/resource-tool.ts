import type {
  AgentToolResult,
  ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import type { TSchema } from "typebox";
import { createRaindropClient } from "./client.ts";
import {
  type RenderTheme,
  renderToolCall,
  renderToolResult,
} from "./render.ts";
import type {
  RaindropApiResponse,
  RaindropClient,
  RaindropOperation,
  RaindropRequest,
} from "./types.ts";

export interface ResourceToolDefinition {
  name: string;
  label: string;
  description: string;
  promptSnippet: string;
  promptGuidelines: string[];
  parameters: TSchema;
  operations: RaindropOperation[];
}

export interface ResourceToolDetails {
  resource: string;
  action?: string;
  endpoint?: string;
  status?: number;
  count?: number;
  data?: RaindropApiResponse;
  error?: string;
}

type ResourceToolResult = AgentToolResult<ResourceToolDetails> & {
  isError: boolean;
};

function textResult(
  text: string,
  details: ResourceToolDetails,
  isError: boolean,
): ResourceToolResult {
  return {
    isError,
    content: [{ type: "text", text }],
    details,
  };
}

function endpoint(request: RaindropRequest): string {
  const query = Object.entries(request.query ?? {})
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined,
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
  return `${request.method} ${request.path}${query ? `?${query}` : ""}`;
}

function resultCount(data: RaindropApiResponse, fallback = 0): number {
  if (Array.isArray(data.items)) return data.items.length;
  if (Array.isArray(data.collections)) return data.collections.length;
  if (typeof data.modified === "number") return data.modified;
  return fallback;
}

function contentText(result: AgentToolResult<unknown>): string {
  const content = result.content[0];
  return content?.type === "text" ? content.text : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resourceDetails(value: unknown): ResourceToolDetails | undefined {
  return isRecord(value)
    ? (value as unknown as ResourceToolDetails)
    : undefined;
}

export function registerResourceTool(
  pi: Pick<ExtensionAPI, "registerTool">,
  definition: ResourceToolDefinition,
  client: RaindropClient = createRaindropClient(),
): void {
  const operationByAction = new Map(
    definition.operations.map((operation) => [operation.action, operation]),
  );

  pi.registerTool({
    name: definition.name,
    label: definition.label,
    description: definition.description,
    promptSnippet: definition.promptSnippet,
    promptGuidelines: definition.promptGuidelines,
    parameters: definition.parameters,
    async execute(
      _toolCallId: string,
      params: Record<string, unknown>,
    ): Promise<ResourceToolResult> {
      const action = typeof params.action === "string" ? params.action : "";
      const operation = operationByAction.get(action);
      if (!operation) {
        const error = `Unknown action: ${action || "<empty>"}`;
        return textResult(
          error,
          { resource: definition.name, action, error },
          true,
        );
      }

      const validation = operation.validate(params);
      if (!validation.ok) {
        return textResult(
          validation.reason,
          { resource: definition.name, action, error: validation.reason },
          true,
        );
      }

      const request = operation.buildRequest(params);
      const response = await client.request(request);
      const requestEndpoint = endpoint(request);
      if (!response.ok) {
        return textResult(
          response.error,
          {
            resource: definition.name,
            action,
            endpoint: requestEndpoint,
            status: response.status,
            error: response.error,
          },
          true,
        );
      }

      const text = operation.format(response.data);
      return textResult(
        text,
        {
          resource: definition.name,
          action,
          endpoint: requestEndpoint,
          status: response.status,
          count: resultCount(response.data),
          data: response.data,
        },
        false,
      );
    },
    renderCall(args: unknown, theme: RenderTheme) {
      const input = isRecord(args) ? args : {};
      const action = typeof input.action === "string" ? input.action : "";
      const summary =
        operationByAction.get(action)?.summarize(input) ??
        `unknown action ${action || "<empty>"}`;
      return renderToolCall(definition.name, summary, theme);
    },
    renderResult(
      result: AgentToolResult<unknown> & { isError?: boolean },
      { expanded }: { expanded: boolean },
      theme: RenderTheme,
      context: { isError: boolean },
    ) {
      const details = resourceDetails(result.details);
      const isError = context.isError || result.isError === true;
      return renderToolResult({
        resource: definition.name,
        content: contentText(result),
        isError,
        expanded,
        collapse: typeof details?.count === "number" && details.count > 1,
        theme,
      });
    },
  });
}
