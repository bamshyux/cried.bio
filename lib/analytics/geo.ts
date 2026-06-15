/** Resolve ISO country code from request headers + optional IP fallback */
export async function resolveCountry(
  headers: Headers,
): Promise<string> {
  const fromHeader =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code");

  if (fromHeader && fromHeader !== "XX" && fromHeader !== "T1") {
    return fromHeader.toUpperCase();
  }

  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headers.get("x-real-ip");

  if (!ip || ip === "127.0.0.1" || ip.startsWith("::")) {
    return "Local";
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = (await res.json()) as { countryCode?: string };
      if (data.countryCode) return data.countryCode;
    }
  } catch {
    /* fallback below */
  }

  return "Unknown";
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
  BR: "Brazil",
  IN: "India",
  JP: "Japan",
  NL: "Netherlands",
  Local: "Local",
  Unknown: "Unknown",
};

export function formatCountry(code: string) {
  return COUNTRY_NAMES[code] ?? code;
}
