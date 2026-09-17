export default function SettingsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-pink-200 bg-white p-6 shadow-sm sm:p-8"
      role="status"
    >
      <span className="sr-only">Loading…</span>
      <div className="h-6 w-40 animate-pulse rounded bg-pink-100" />
      <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-pink-100" />

      <div className="mt-8 space-y-4">
        <div className="h-11 animate-pulse rounded-lg bg-pink-100" />
        <div className="h-24 animate-pulse rounded-lg bg-pink-100" />
      </div>

      <div className="mt-6 h-10 w-32 animate-pulse rounded-md bg-pink-100" />
    </div>
  );
}
