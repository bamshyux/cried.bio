let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playSupportMessageSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    void ctx.resume();

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1174.66, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.42);
    osc2.stop(now + 0.42);
  } catch {
    // Ignore if autoplay is blocked or audio is unavailable.
  }
}

export type SupportReplyAlert = {
  subject: string;
  preview: string;
};

export function pickLatestUnreadConversation(
  conversations: Array<{
    subject: string;
    last_message_preview: string | null;
    last_message_at: string | null;
    unread_count?: number;
  }>,
): SupportReplyAlert | null {
  const unread = conversations.filter((item) => (item.unread_count ?? 0) > 0);
  if (unread.length === 0) return null;

  const sorted = [...unread].sort(
    (a, b) =>
      new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime(),
  );

  const top = sorted[0];
  return {
    subject: top.subject,
    preview: top.last_message_preview ?? "Support replied to your ticket",
  };
}
