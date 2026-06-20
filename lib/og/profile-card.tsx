import { ogBackgroundCss } from "@/lib/og/resolve-background";
import type { OgProfileSnapshot } from "@/lib/og/types";
import { SITE_HOST } from "@/lib/site";

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return value.toLocaleString("en-US");
}

function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3C16 3 7 14.5 7 20.5C7 25.194 10.806 29 16 29C21.194 29 25 25.194 25 20.5C25 14.5 16 3 16 3Z"
        fill="#fafafa"
      />
    </svg>
  );
}

function DefaultAvatar({ name, accent }: { name: string; accent: string }) {
  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <div
      style={{
        width: 112,
        height: 112,
        borderRadius: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(145deg, ${accent}, #090909)`,
        color: "#fafafa",
        fontSize: 42,
        fontWeight: 700,
        border: "4px solid rgba(255,255,255,0.18)",
      }}
    >
      {initial}
    </div>
  );
}

export function DefaultOgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #111111 0%, #090909 55%, #050505 100%)",
        color: "#fafafa",
        fontFamily: "Inter",
      }}
    >
      <BrandMark size={72} />
      <div style={{ marginTop: 28, fontSize: 56, fontWeight: 700, letterSpacing: "-0.03em" }}>
        cried.bio
      </div>
      <div style={{ marginTop: 14, fontSize: 28, color: "rgba(250,250,250,0.72)" }}>
        Your bio link, your way
      </div>
    </div>
  );
}

export function OgProfileCard({ profile }: { profile: OgProfileSnapshot }) {
  const backgroundCss = ogBackgroundCss(profile.background);
  const cardBg = `rgba(9, 9, 9, ${profile.cardOpacity / 100})`;
  const stats: string[] = [`${formatCount(profile.followers)} followers`];
  if (profile.showViews && profile.views != null) {
    stats.push(`${formatCount(profile.views)} views`);
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: backgroundCss,
        fontFamily: "Inter",
        color: profile.textColor,
      }}
    >
      {profile.background.kind === "image" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.background.url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 100%)",
            }}
          />
        </>
      ) : null}

      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          alignItems: "center",
          padding: "56px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 920,
            padding: "34px 38px",
            borderRadius: 28,
            background: cardBg,
            border: `2px solid ${profile.accentColor}55`,
            boxShadow: `0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                width={112}
                height={112}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 9999,
                  objectFit: "cover",
                  border: `4px solid ${profile.accentColor}88`,
                }}
              />
            ) : (
              <DefaultAvatar name={profile.displayName} accent={profile.accentColor} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                }}
              >
                {profile.displayName}
              </div>
              <div
                style={{
                  fontSize: 26,
                  color: "rgba(250,250,250,0.62)",
                  fontFamily: "Inter",
                }}
              >
                {SITE_HOST}/{profile.username}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              lineHeight: 1.45,
              color: "rgba(250,250,250,0.84)",
              maxHeight: 120,
              overflow: "hidden",
            }}
          >
            {profile.bio}
          </div>

          {profile.badges.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 22,
              }}
            >
              {profile.badges.map((badge) => (
                <div
                  key={badge.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${badge.color}66`,
                    color: profile.textColor,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 9999,
                      background: badge.color,
                    }}
                  />
                  {badge.name}
                </div>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 24,
              fontSize: 22,
              color: "rgba(250,250,250,0.58)",
            }}
          >
            {stats.map((stat) => (
              <div key={stat}>{stat}</div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 34,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderRadius: 9999,
          background: "rgba(0,0,0,0.42)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fafafa",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        <BrandMark size={20} />
        cried.bio
      </div>
    </div>
  );
}
