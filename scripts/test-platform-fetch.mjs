const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(name, result);
  } catch (error) {
    console.log(name, "ERR", error.message);
  }
}

await test("fxtwitter", async () => {
  const res = await fetch("https://api.fxtwitter.com/2/profile/bamshyF1");
  const data = await res.json();
  return { status: res.status, followers: data?.user?.followers };
});

await test("youtube-scrape", async () => {
  const res = await fetch("https://www.youtube.com/@bamshy/about", {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
  });
  const html = await res.text();
  const match = html.match(/"subscriberCountText":"([^"]+)"/);
  return { status: res.status, sub: match?.[1] ?? null, len: html.length };
});

await test("spotify-embed-token", async () => {
  const res = await fetch("https://open.spotify.com/embed/artist/3TVXtAsR1Inumwj472S9r4", {
    headers: { "User-Agent": USER_AGENT },
  });
  const html = await res.text();
  const hasToken = /accessToken\\":\\"/.test(html) || /"accessToken":"[^"]+"/.test(html);
  return { status: res.status, hasToken, len: html.length };
});

await test("spotify-pathfinder-v2", async () => {
  const embedRes = await fetch("https://open.spotify.com/embed/artist/3TVXtAsR1Inumwj472S9r4", {
    headers: { "User-Agent": USER_AGENT },
  });
  const html = await embedRes.text();
  const tokenMatch =
    html.match(/"accessToken":"([^"]+)"/) ?? html.match(/accessToken\\":\\"([^\\"]+)/);
  if (!tokenMatch) return { ok: false, reason: "no-token" };
  const token = tokenMatch[1];

  const variables = JSON.stringify({
    uri: "spotify:artist:3TVXtAsR1Inumwj472S9r4",
    locale: "",
    includePrerelease: true,
  });
  const extensions = JSON.stringify({
    persistedQuery: {
      version: 1,
      sha256Hash: "79a4a9d7c3a3781d801e62b62ef11c7ee56fce2626772eb26cd20c69f84b3f49",
    },
  });
  const pfRes = await fetch(
    `https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=${encodeURIComponent(variables)}&extensions=${encodeURIComponent(extensions)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "app-platform": "WebPlayer",
        origin: "https://open.spotify.com",
        referer: "https://open.spotify.com/",
      },
    },
  );
  const pf = await pfRes.json();
  return {
    status: pfRes.status,
    followers: pf?.data?.artistUnion?.stats?.followers,
    name: pf?.data?.artistUnion?.profile?.name,
  };
});
