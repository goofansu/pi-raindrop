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
  link?: unknown;
  links?: unknown;
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

export function isLink(value: unknown): value is string {
  if (typeof value !== "string" || value === "" || !URL.canParse(value))
    return false;
  // URL.canParse accepts any absolute URI, including "tel:123",
  // "javascript:alert(1)" and Windows paths. Bookmarks are web links.
  const { protocol } = new URL(value);
  return protocol === "http:" || protocol === "https:";
}

// The create actions take only a URL. Anything else a caller sends would be
// dropped silently, so reject it and point at the action that does apply it.
export function rejectCreateExtras(
  input: BookmarkInput,
  action: string,
  accepted: string,
): ValidationResult | undefined {
  for (const field of ["item", "items", "collectionId"] as const) {
    if (input[field] !== undefined)
      return invalid(
        `${action} takes only ${accepted}; ${field} is not applied on create. Create the bookmark, then set title, tags, or collection with update_one.`,
      );
  }
  return undefined;
}
