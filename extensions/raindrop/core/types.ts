export interface RaindropOperation {
  action: string;
  validate(input: Record<string, unknown>): ValidationResult;
  buildRequest(input: Record<string, unknown>): RaindropRequest;
  format(data: RaindropApiResponse): string;
  summarize(input: Record<string, unknown>): string;
}

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
