"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SupportTypingPayload = {
  userId: string;
  isStaff: boolean;
  displayName?: string;
  isTyping: boolean;
};

export function useSupportTypingIndicator() {
  const [typingLabel, setTypingLabel] = useState<string | null>(null);

  const handleTyping = useCallback((payload: SupportTypingPayload) => {
    if (!payload.isTyping) {
      setTypingLabel(null);
      return;
    }

    const label = payload.isStaff
      ? payload.displayName
        ? `${payload.displayName} (Staff)`
        : "Staff"
      : payload.displayName ?? "User";

    setTypingLabel(label);
  }, []);

  return { typingLabel, handleTyping, clearTyping: () => setTypingLabel(null) };
}

const typingSendChannels = new Map<string, ReturnType<ReturnType<typeof createClient>["channel"]>>();

export function useSupportRealtime(options: {
  userId: string | null;
  conversationId: string | null;
  isStaff: boolean;
  enabled?: boolean;
  onConversationChange: () => void;
  onMessageInsert: (conversationId: string) => void;
  onTyping?: (payload: SupportTypingPayload) => void;
}) {
  const onConversationChangeRef = useRef(options.onConversationChange);
  const onMessageInsertRef = useRef(options.onMessageInsert);
  const onTypingRef = useRef(options.onTyping);
  const conversationIdRef = useRef(options.conversationId);

  onConversationChangeRef.current = options.onConversationChange;
  onMessageInsertRef.current = options.onMessageInsert;
  onTypingRef.current = options.onTyping;
  conversationIdRef.current = options.conversationId;

  useEffect(() => {
    if (!options.enabled || !options.userId) return;

    let cancelled = false;
    const role = options.isStaff ? "staff" : "user";

    try {
      const supabase = createClient();
      const channels: ReturnType<typeof supabase.channel>[] = [];

      const conversationFilter = options.isStaff
        ? undefined
        : `user_id=eq.${options.userId}`;

      const inboxChannel = supabase
        .channel(`support-inbox:${options.userId}:${role}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_conversations",
            ...(conversationFilter ? { filter: conversationFilter } : {}),
          },
          () => {
            if (!cancelled) onConversationChangeRef.current();
          },
        )
        .subscribe();

      channels.push(inboxChannel);

      if (options.conversationId) {
        const activeConversationId = options.conversationId;
        const messageChannel = supabase
          .channel(`support-messages:${activeConversationId}:${options.userId}:${role}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_messages",
              filter: `conversation_id=eq.${activeConversationId}`,
            },
            (payload) => {
              const row = payload.new as { conversation_id?: string };
              if (!cancelled && row.conversation_id) {
                onMessageInsertRef.current(row.conversation_id);
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "support_messages",
              filter: `conversation_id=eq.${activeConversationId}`,
            },
            () => {
              if (!cancelled) {
                onMessageInsertRef.current(conversationIdRef.current ?? activeConversationId);
              }
            },
          )
          .subscribe();

        channels.push(messageChannel);

        const typingChannel = supabase
          .channel(`support-typing:${activeConversationId}`)
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            const data = payload as SupportTypingPayload;
            if (!data.userId) return;

            const isSelf =
              data.userId === options.userId && data.isStaff === options.isStaff;
            if (isSelf || cancelled) return;

            onTypingRef.current?.({
              userId: data.userId,
              isStaff: Boolean(data.isStaff),
              displayName: data.displayName,
              isTyping: Boolean(data.isTyping),
            });
          })
          .subscribe();

        channels.push(typingChannel);
      }

      return () => {
        cancelled = true;
        for (const channel of channels) {
          void supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      console.error("[support] realtime setup failed:", error);
      return undefined;
    }
  }, [
    options.conversationId,
    options.enabled,
    options.isStaff,
    options.userId,
  ]);
}

export function broadcastSupportTyping(payload: {
  conversationId: string;
  userId: string;
  isStaff: boolean;
  displayName?: string;
  isTyping: boolean;
}) {
  const supabase = createClient();
  const channelKey = payload.conversationId;
  let channel = typingSendChannels.get(channelKey);

  if (!channel) {
    channel = supabase.channel(`support-typing:${channelKey}`);
    typingSendChannels.set(channelKey, channel);
    void channel.subscribe();
  }

  void channel.send({
    type: "broadcast",
    event: "typing",
    payload: {
      userId: payload.userId,
      isStaff: payload.isStaff,
      displayName: payload.displayName,
      isTyping: payload.isTyping,
    },
  });
}
