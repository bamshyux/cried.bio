import {
  DATABASE_UNAVAILABLE_CODE,
  DATABASE_UNAVAILABLE_USER_MESSAGE,
  isCloudflareStatus,
  isUnavailableStatus,
  looksLikeHtml,
  looksLikeJson,
} from "@/lib/db/errors";

const FETCH_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 400;
const BODY_PREVIEW_LENGTH = 160;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function safeUrl(input: RequestInfo | URL): string {
  try {
    const parsed = new URL(requestUrl(input));
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "supabase-request";
  }
}

function canRetryBody(init?: RequestInit): boolean {
  const body = init?.body;
  if (body == null) return true;
  if (typeof body === "string") return true;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return true;
  if (typeof Blob !== "undefined" && body instanceof Blob) return true;
  if (body instanceof ArrayBuffer) return true;
  if (ArrayBuffer.isView(body)) return true;
  return false;
}

function mergeAbortSignals(
  timeoutMs: number,
  existing?: AbortSignal | null,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
  }, timeoutMs);

  const onExistingAbort = () => {
    controller.abort(existing?.reason);
  };

  if (existing) {
    if (existing.aborted) {
      controller.abort(existing.reason);
    } else {
      existing.addEventListener("abort", onExistingAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      existing?.removeEventListener("abort", onExistingAbort);
    },
  };
}

function unavailablePayload(status: number) {
  return JSON.stringify({
    message: DATABASE_UNAVAILABLE_USER_MESSAGE,
    code: DATABASE_UNAVAILABLE_CODE,
    status,
  });
}

function unavailableResponse(status: number): Response {
  const safeStatus = status >= 400 && status <= 599 && status !== 204 && status !== 205
    ? status
    : 503;
  return new Response(unavailablePayload(safeStatus), {
    status: safeStatus,
    statusText: "Database Unavailable",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-cried-db-unavailable": "1",
    },
  });
}

function isNullBodyStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

function reconstructResponse(text: string, response: Response): Response {
  if (isNullBodyStatus(response.status)) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  }
  const headers = new Headers(response.headers);
  if (!headers.get("content-type") && looksLikeJson(text)) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function previewBody(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, BODY_PREVIEW_LENGTH);
}

function shouldRetryStatus(status: number): boolean {
  return isUnavailableStatus(status);
}

function logNonJsonFailure(url: string, status: number, contentType: string, text: string) {
  console.error("[cried.bio] Supabase returned a non-JSON or upstream error response:", {
    url: safeUrl(url),
    status,
    contentType: contentType || "unknown",
    bodyPreview: previewBody(text) || "(empty)",
  });
}

async function normalizeResponse(response: Response, url: string): Promise<Response> {
  if (isNullBodyStatus(response.status)) {
    return response;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const jsonContent = contentType.includes("application/json");
  const htmlContent = contentType.includes("text/html");
  const cloudflare = isCloudflareStatus(response.status);

  if (response.ok && !htmlContent && !cloudflare) {
    return response;
  }

  if (!response.ok && jsonContent && !cloudflare && response.status < 500) {
    return response;
  }

  const needsInspection = htmlContent || cloudflare || !jsonContent || !response.ok;
  if (!needsInspection) return response;

  const text = await response.text();
  const html = looksLikeHtml(text) || htmlContent;
  const jsonBody = jsonContent || looksLikeJson(text);

  if (html || cloudflare || (!jsonBody && (isUnavailableStatus(response.status) || !response.ok))) {
    logNonJsonFailure(url, response.status, contentType, text);
    return unavailableResponse(response.status || 503);
  }

  return reconstructResponse(text, response);
}

async function fetchOnce(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<Response> {
  const { signal, cleanup } = mergeAbortSignals(FETCH_TIMEOUT_MS, init?.signal ?? null);
  try {
    const response = await fetch(input, { ...init, signal });
    return await normalizeResponse(response, requestUrl(input));
  } catch (error) {
    const aborted = signal.aborted && init?.signal?.aborted;
    if (aborted) throw error;

    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cried.bio] Supabase request failed:", {
      url: safeUrl(input),
      name: name || "Error",
      message: message.slice(0, BODY_PREVIEW_LENGTH),
    });
    return unavailableResponse(name === "TimeoutError" || /timed?\s*out/i.test(message) ? 504 : 503);
  } finally {
    cleanup();
  }
}

/** Fetch wrapper for Supabase clients: timeouts, one retry, and no HTML leak-through. */
export async function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const first = await fetchOnce(input, init);
  const retryable =
    canRetryBody(init) &&
    !init?.signal?.aborted &&
    shouldRetryStatus(first.status) &&
    first.headers.get("x-cried-db-unavailable") === "1";

  if (!retryable) return first;

  console.warn("[cried.bio] Retrying Supabase request once after a transient failure:", {
    url: safeUrl(input),
    status: first.status,
  });
  await sleep(RETRY_DELAY_MS);
  return fetchOnce(input, init);
}
