export default function ProfileCardSkeleton() {
  return (
    <article className="w-full animate-pulse rounded-xl border border-pink-200 bg-white shadow-sm sm:p-4">
      <div className="flex w-full min-w-0 flex-col sm:flex-row sm:items-stretch sm:gap-4">
        <div className="mx-auto aspect-[5/4] w-full max-w-full shrink-0 rounded-none bg-pink-100 sm:mx-0 sm:aspect-auto sm:h-28 sm:max-w-[7rem] sm:w-28 sm:rounded-lg" />

        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3 sm:min-h-28 sm:justify-between sm:gap-4 sm:p-0 sm:pt-0">
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 w-2/3 rounded bg-pink-100" />
              <div className="h-5 w-6 shrink-0 rounded bg-pink-100" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-1/3 rounded bg-pink-100" />
              <div className="h-3.5 w-1/3 rounded bg-pink-100" />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="h-3.5 w-20 rounded bg-pink-100" />
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="h-8 flex-1 rounded-md bg-pink-100 sm:w-24 sm:flex-none" />
              <div className="h-8 flex-1 rounded-md bg-pink-100 sm:w-24 sm:flex-none" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
