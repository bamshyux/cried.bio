import type { ActivityEvent } from "@/lib/types/activity";

export function ProfileActivitySection({
  events,
  enabled = true,
}: {
  events: ActivityEvent[];
  enabled?: boolean;
}) {
  if (!enabled || events.length === 0) return null;

  return (
    <div className="mt-6 border-t border-white/[0.06] pt-6">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-neutral-500">Recent activity</p>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--bf-accent)]" />
            <span>
              <span className="text-neutral-300">{event.title}</span>
              <span className="ml-2 text-neutral-600">
                {new Date(event.created_at).toLocaleDateString()}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
