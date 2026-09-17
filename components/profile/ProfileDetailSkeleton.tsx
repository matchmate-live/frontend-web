export default function ProfileDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col" role="status">
      <span className="sr-only">Loading profile…</span>

      <div className="relative w-full shrink-0 bg-pink-50/50 px-4 sm:px-8">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-2xl animate-pulse rounded-lg bg-pink-100 sm:aspect-[16/10] sm:max-w-none lg:aspect-[21/9] lg:max-h-[min(42vh,520px)]" />
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-pink-100 pb-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-8 w-48 max-w-full animate-pulse rounded bg-pink-100" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded bg-pink-100" />
          </div>
          <div className="h-9 w-12 shrink-0 animate-pulse rounded bg-pink-100" />
        </div>

        <div className="h-4 w-40 animate-pulse rounded bg-pink-100" />

        <div className="space-y-2 border-t border-pink-100 pt-6">
          <div className="h-3 w-24 animate-pulse rounded bg-pink-100" />
          <div className="h-4 w-full animate-pulse rounded bg-pink-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-pink-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-pink-100" />
        </div>
      </div>
    </div>
  );
}
