export function PresetPreviewBanner({ title }: { title: string }) {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-violet-500/25 bg-[#120818]/90 px-4 py-2.5 text-center backdrop-blur-md">
      <p className="text-sm text-violet-100">
        <span className="font-semibold text-white">Preview mode</span>
        {" — "}
        Viewing <span className="font-medium text-white">{title}</span> on your profile. Nothing
        has been saved.
      </p>
    </div>
  );
}
