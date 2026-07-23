export async function readJsonResponse<T extends Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "Server returned an empty response."
        : `Request failed (${response.status}). The checkout API may be misconfigured or unavailable.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "Server returned an invalid response."
        : `Request failed (${response.status}). Please try again.`,
    );
  }
}
