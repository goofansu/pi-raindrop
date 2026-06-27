import { formatBookmarkItem } from "../../core/format.ts";
import type {
  RaindropApiResponse,
  RaindropRequest,
  ValidationResult,
} from "../../core/types.ts";

export interface BookmarkInput extends Record<string, unknown> {
  id?: unknown;
  collectionId?: unknown;
  search?: unknown;
  sort?: unknown;
  page?: unknown;
  perpage?: unknown;
  nested?: unknown;
  item?: unknown;
  items?: unknown;
  body?: unknown;
}

export function ok(): ValidationResult {
  return { ok: true };
}

export function invalid(reason: string): ValidationResult {
  return { ok: false, reason };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePerpage(input: BookmarkInput): ValidationResult {
  if (input.perpage === undefined) return ok();
  if (typeof input.perpage !== "number")
    return invalid("perpage must be a number");
  return input.perpage > 50 ? invalid("perpage must be at most 50") : ok();
}

export function query(
  input: BookmarkInput,
  fields: Array<"search" | "sort" | "page" | "perpage" | "nested">,
): RaindropRequest["query"] {
  const result: NonNullable<RaindropRequest["query"]> = {};
  for (const field of fields) {
    const value = input[field];
    if (["string", "number", "boolean"].includes(typeof value)) {
      result[field] = value as string | number | boolean;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

export function formatItem(data: RaindropApiResponse, prefix: string): string {
  return `${prefix}\n\n${formatBookmarkItem(isObject(data.item) ? data.item : {})}`;
}

export function formatItems(
  data: RaindropApiResponse,
  summary: string,
): string {
  const items = (data.items ?? [])
    .filter(isObject)
    .map((item, index) => `${index + 1}. ${formatBookmarkItem(item)}`);
  return items.length ? `${summary}\n\n${items.join("\n")}` : summary;
}
