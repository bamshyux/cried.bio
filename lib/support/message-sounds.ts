import { isSupportMessageMine } from "@/lib/support/format";
import { playSupportMessageSound } from "@/lib/support/notifications";

export type SupportMessageSoundTracker = {
  seenIds: Set<string>;
  primed: boolean;
};

export function createSupportMessageSoundTracker(): SupportMessageSoundTracker {
  return { seenIds: new Set(), primed: false };
}

export function resetSupportMessageSoundTracker(tracker: SupportMessageSoundTracker) {
  tracker.seenIds.clear();
  tracker.primed = false;
}

export function playSoundsForNewIncomingMessages(
  messages: Array<{ id: string; is_staff: boolean }>,
  isStaffViewer: boolean,
  tracker: SupportMessageSoundTracker,
): number {
  if (!tracker.primed) {
    for (const message of messages) tracker.seenIds.add(message.id);
    tracker.primed = true;
    return 0;
  }

  const newIncoming = messages.filter(
    (message) =>
      !isSupportMessageMine(message, isStaffViewer) && !tracker.seenIds.has(message.id),
  );

  for (const message of messages) tracker.seenIds.add(message.id);

  newIncoming.forEach((_, index) => {
    window.setTimeout(() => playSupportMessageSound(), index * 220);
  });

  return newIncoming.length;
}

export async function playSoundsForConversationMessages(
  conversationId: string,
  isStaffViewer: boolean,
  tracker: SupportMessageSoundTracker,
  fetchMessages: (
    id: string,
  ) => Promise<
    | { messages: Array<{ id: string; is_staff: boolean }> }
    | { error?: string; messages?: Array<{ id: string; is_staff: boolean }> }
  >,
): Promise<number> {
  const result = await fetchMessages(conversationId);
  if ("error" in result && result.error) return 0;
  if (!result.messages) return 0;
  return playSoundsForNewIncomingMessages(result.messages, isStaffViewer, tracker);
}
