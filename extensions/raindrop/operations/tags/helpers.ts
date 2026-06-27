import type { RaindropApiResponse, ValidationResult } from "../../core/types.ts";
import { formatTagItem } from "../../core/format.ts";

export interface TagInput extends Record<string, unknown> {
  tags?: unknown;
  replace?: unknown;
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

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function formatTags(data: RaindropApiResponse, prefix: string): string {
  const items = (data.items ?? [])
    .filter(isObject)
    .map((item, index) => `${index + 1}. ${formatTagItem(item)}`);
  return items.length ? `${prefix}\n\n${items.join("\n")}` : prefix;
}

export function formatMutation(): string {
  return "Updated tag(s).";
}
