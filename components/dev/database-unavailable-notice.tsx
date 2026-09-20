import { DATABASE_UNAVAILABLE_USER_MESSAGE } from "@/lib/db/errors";

export function DatabaseUnavailableNotice({
  variant = "page",
}: {
  variant?: "page" | "inline";
}) {
  if (variant === "inline") {
    return (
      <p className="rounded-xl border border-amber-500/20 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
        {DATABASE_UNAVAILABLE_USER_MESSAGE}
      </p>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-[#090909] px-6 text-center text-amber-100">
      <div className="max-w-md space-y-2">
        <p className="text-sm font-medium text-amber-50">cried.bio</p>
        <p className="text-base text-amber-100/90">{DATABASE_UNAVAILABLE_USER_MESSAGE}</p>
      </div>
    </div>
  );
}
