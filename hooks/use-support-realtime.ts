"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSupportRealtime(options: {
  userId: string | null;
  conversationId: string | null;
  isStaff: boolean;
  enabled?: boolean;
  onConversationChange: () => void;
  onMessageInsert: (conversationId: string) => void;
  onTyping?: (payload: { userId: string; isTyping: boolean }) => void;
}) {
  const onConversationChangeRef = useRef(options.onConversationChange);
  const onMessageInsertRef = useRef(options.onMessageInsert);
  const onTypingRef = useRef(options.onTyping);

  onConversationChangeRef.current = options.onConversationChange;
  onMessageInsertRef.current = options.onMessageInsert;
  onTypingRef.current = options.onTyping;

  useEffect(() => {
    if (!options.enabled || !options.userId) return;

    let cancelled = false;

    try {
      const supabase = createClient();
      const channels: ReturnType<typeof supabase.channel>[] = [];

      const conversationFilter = options.isStaff
        ? undefined
        : `user_id=eq.${options.userId}`;

      const inboxChannel = supabase
        .channel(`support-inbox:${options.userId}`)
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
        const messageChannel = supabase
          .channel(`support-messages:${options.conversationId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_messages",
              filter: `conversation_id=eq.${options.conversationId}`,
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
              filter: `conversation_id=eq.${options.conversationId}`,
            },
            () => {
              if (!cancelled) onMessageInsertRef.current(options.conversationId!);
            },
          )
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            const data = payload as { userId?: string; isTyping?: boolean };
            if (!data.userId || data.userId === options.userId) return;
            if (!cancelled) {
              onTypingRef.current?.({ userId: data.userId, isTyping: Boolean(data.isTyping) });
            }
          })
          .subscribe();

        channels.push(messageChannel);
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

export function broadcastSupportTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean,
) {
  const supabase = createClient();
  const channel = supabase.channel(`support-messages:${conversationId}`);
  void channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, isTyping },
      });
    }
  });
}
