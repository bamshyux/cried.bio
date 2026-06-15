/** Resolve ISO 3166-1 alpha-2 country code from request headers + IP fallback */
export async function resolveCountry(headers: Headers): Promise<string> {
  const fromHeader =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    headers.get("cloudfront-viewer-country");

  if (fromHeader) {
    const code = fromHeader.trim().toUpperCase();
    if (code && code !== "XX" && code !== "T1") return code;
  }

  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip");

  if (!ip || isPrivateOrLocalIp(ip)) {
    return "LOCAL";
  }

  const fromLookup = await lookupCountryByIp(ip);
  return fromLookup ?? "UNKNOWN";
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fe80:")) return true;
  if (ip.includes(":")) return false;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  const providers = [
    async () => {
      const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_code/`, {
        signal: AbortSignal.timeout(4000),
        headers: { Accept: "text/plain" },
      });
      if (!res.ok) return null;
      const code = (await res.text()).trim().toUpperCase();
      return code.length === 2 ? code : null;
    },
    async () => {
      const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=country_code,success`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { success?: boolean; country_code?: string };
      if (data.success && data.country_code) return data.country_code.toUpperCase();
      return null;
    },
    async () => {
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode,status`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { status?: string; countryCode?: string };
      if (data.status === "success" && data.countryCode) return data.countryCode.toUpperCase();
      return null;
    },
  ];

  for (const provider of providers) {
    try {
      const code = await provider();
      if (code) return code;
    } catch {
      /* try next provider */
    }
  }

  return null;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** Human-readable country label from stored ISO code */
export function formatCountry(code: string): string {
  const normalized = code.trim().toUpperCase();

  if (!normalized || normalized === "UNKNOWN") return "Unknown location";
  if (normalized === "LOCAL") return "Local / private network";

  if (/^[A-Z]{2}$/.test(normalized)) {
    try {
      return regionNames.of(normalized) ?? normalized;
    } catch {
      return normalized;
    }
  }

  return code;
}

/** Hide dev/private buckets when real geo data exists */
export function isInternalCountryLabel(label: string): boolean {
  return label === "Local / private network" || label === "Unknown location";
}
