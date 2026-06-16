import type { ProfileSettings } from "@/lib/types/settings";
import { TypingBio } from "./profile-effects";

export function ProfileBio({
  text,
  settings,
  className,
  inline = false,
}: {
  text: string;
  settings: ProfileSettings;
  className?: string;
  inline?: boolean;
}) {
  const bio = (
    <TypingBio
      text={text}
      enabled={settings.typing_bio}
      settings={settings}
      className={inline ? className : undefined}
    />
  );

  if (inline) return bio;

  return (
    <div
      className={`bf-profile-block bf-profile-bio-block profile-bio mb-5 max-w-2xl${className ? ` ${className}` : ""}`}
    >
      {bio}
    </div>
  );
}
