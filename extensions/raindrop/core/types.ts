export type RaindropOperation =
  | "list"
  | "create_many"
  | "update_many"
  | "get"
  | "tags"
  | "collections"
  | "rename_tag"
  | "merge_tags";

export type RaindropHttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RaindropRequest {
  method: RaindropHttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export interface RaindropApiResponse {
  result?: boolean;
  item?: unknown;
  items?: unknown[];
  collections?: unknown[];
  modified?: number;
  [key: string]: unknown;
}

export type RaindropClientResult =
  | { ok: true; status: number; data: RaindropApiResponse }
  | { ok: false; status?: number; error: string };

export interface RaindropClient {
  request(request: RaindropRequest): Promise<RaindropClientResult>;
}

export interface RaindropToolDetails {
  operation?: RaindropOperation;
  endpoint?: string;
  status?: number;
  count?: number;
  data?: RaindropApiResponse;
  error?: string;
}
