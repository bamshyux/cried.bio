"use client";

import { createContext, useContext } from "react";
import type { DiscordPresence } from "@/lib/discord/types";

const DiscordPresenceContext = createContext<DiscordPresence | null>(null);

export function DiscordPresenceProvider({
  presence,
  children,
}: {
  presence: DiscordPresence | null;
  children: React.ReactNode;
}) {
  return (
    <DiscordPresenceContext.Provider value={presence}>
      {children}
    </DiscordPresenceContext.Provider>
  );
}

export function useDiscordPresence() {
  return useContext(DiscordPresenceContext);
}
