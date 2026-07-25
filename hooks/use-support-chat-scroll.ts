"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 72;

export function useSupportChatScroll(messageCount: number, extraTriggers: unknown[] = []) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const isNearBottomRef = useRef(true);
  const prevCountRef = useRef(messageCount);
  const forceScrollRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setShowNewMessages(false);
  }, []);

  const handleScroll = useCallback(() => {
    const near = isNearBottom();
    isNearBottomRef.current = near;
    if (near) setShowNewMessages(false);
  }, [isNearBottom]);

  const markForceScroll = useCallback(() => {
    forceScrollRef.current = true;
  }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = messageCount;
    const hasNewMessages = messageCount > prev;

    const run = () => {
      if (forceScrollRef.current || isNearBottomRef.current) {
        scrollToBottom(forceScrollRef.current ? "auto" : "smooth");
        forceScrollRef.current = false;
        return;
      }
      if (hasNewMessages) setShowNewMessages(true);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extraTriggers are intentional scroll signals
  }, [messageCount, scrollToBottom, ...extraTriggers]);

  return {
    scrollRef,
    showNewMessages,
    scrollToBottom,
    handleScroll,
    markForceScroll,
  };
}
