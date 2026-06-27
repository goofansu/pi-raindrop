import { formatCollectionItem } from "../../core/format.ts";
import type {
  RaindropApiResponse,
  ValidationResult,
} from "../../core/types.ts";

export function ok(): ValidationResult {
  return { ok: true };
}

export function invalid(reason: string): ValidationResult {
  return { ok: false, reason };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatCollections(
  data: RaindropApiResponse,
  prefix: string,
): string {
  const items = (data.collections ?? [])
    .filter(isObject)
    .map((item, index) => `${index + 1}. ${formatCollectionItem(item)}`);
  return items.length ? `${prefix}\n\n${items.join("\n")}` : prefix;
}
