import type {
  RaindropApiResponse,
  RaindropClient,
  RaindropClientResult,
  RaindropRequest,
} from "./types.ts";

const RAINDROP_API_BASE_URL = "https://api.raindrop.io/rest/v1";
const ERROR_BODY_LIMIT = 500;

type FetchImpl = (url: string | URL, init?: RequestInit) => Promise<Response>;

function buildUrl(request: RaindropRequest): string {
  const url = new URL(`${RAINDROP_API_BASE_URL}${request.path}`);
  for (const [key, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function redactSecret(text: string, secret?: string): string {
  if (!secret) {
    return text;
  }
  return text.split(secret).join("[REDACTED]");
}

function formatUnknownError(error: unknown, apiKey?: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSecret(message, apiKey);
}

export function formatRaindropApiError(status: number, body: string): string {
  const truncatedBody = body.slice(0, ERROR_BODY_LIMIT);
  return `Raindrop API failed: ${status}${truncatedBody ? ` ${truncatedBody}` : ""}`;
}

export function createRaindropClient(
  fetchImpl: FetchImpl = fetch,
  apiKey: string | undefined = process.env.RAINDROP_API_KEY,
): RaindropClient {
  return {
    async request(request: RaindropRequest): Promise<RaindropClientResult> {
      if (!apiKey) {
        return { ok: false, error: "RAINDROP_API_KEY is not set" };
      }

      let response: Response;
      try {
        response = await fetchImpl(buildUrl(request), {
          method: request.method,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body:
            request.body === undefined
              ? undefined
              : JSON.stringify(request.body),
        });
      } catch (error) {
        return { ok: false, error: formatUnknownError(error, apiKey) };
      }

      if (!response.ok) {
        try {
          const body = redactSecret(await response.text(), apiKey);
          return {
            ok: false,
            status: response.status,
            error: formatRaindropApiError(response.status, body),
          };
        } catch (error) {
          return {
            ok: false,
            status: response.status,
            error: formatUnknownError(error, apiKey),
          };
        }
      }

      try {
        const text = await response.text();
        const data = (text ? JSON.parse(text) : {}) as RaindropApiResponse;
        return { ok: true, status: response.status, data };
      } catch (error) {
        return {
          ok: false,
          status: response.status,
          error: formatUnknownError(error, apiKey),
        };
      }
    },
  };
}
