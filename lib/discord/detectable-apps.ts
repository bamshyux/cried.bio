type DetectableApplication = {
  id: string | number;
  name?: string;
  icon_hash?: string | null;
  aliases?: string[];
};

const ICON_SIZE = 128;

let iconIndexPromise: Promise<Map<string, string>> | null = null;

function iconUrl(applicationId: string, iconHash: string): string {
  return `https://cdn.discordapp.com/app-icons/${applicationId}/${iconHash}.png?size=${ICON_SIZE}`;
}

function indexDetectableApps(apps: DetectableApplication[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const app of apps) {
    const applicationId = String(app.id ?? "").trim();
    const iconHash = app.icon_hash?.trim();
    if (!applicationId || !iconHash) continue;

    const url = iconUrl(applicationId, iconHash);
    index.set(applicationId, url);

    const names = new Set<string>();
    if (app.name?.trim()) names.add(app.name.trim().toLowerCase());
    for (const alias of app.aliases ?? []) {
      if (alias?.trim()) names.add(alias.trim().toLowerCase());
    }

    for (const name of names) {
      if (!index.has(`name:${name}`)) {
        index.set(`name:${name}`, url);
      }
    }
  }

  return index;
}

async function loadDetectableIconIndex(): Promise<Map<string, string>> {
  try {
    const res = await fetch("https://discord.com/api/v9/applications/detectable", {
      headers: { "User-Agent": "mybio-discord-presence/1.0" },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return new Map();

    const apps = (await res.json()) as DetectableApplication[];
    if (!Array.isArray(apps)) return new Map();

    return indexDetectableApps(apps);
  } catch {
    return new Map();
  }
}

function getDetectableIconIndex(): Promise<Map<string, string>> {
  if (!iconIndexPromise) {
    iconIndexPromise = loadDetectableIconIndex();
  }
  return iconIndexPromise;
}

/** Resolve a game icon from Discord's public detectable-applications list. */
export async function resolveDetectableGameIconUrl(
  applicationId?: string | null,
  gameName?: string | null,
): Promise<string | null> {
  const index = await getDetectableIconIndex();
  if (!index.size) return null;

  const id = applicationId?.trim();
  if (id && index.has(id)) {
    return index.get(id)!;
  }

  const nameKey = gameName?.trim().toLowerCase();
  if (nameKey && index.has(`name:${nameKey}`)) {
    return index.get(`name:${nameKey}`)!;
  }

  return null;
}
