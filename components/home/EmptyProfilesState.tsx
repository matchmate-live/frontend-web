export default function EmptyProfilesState() {
  return (
    <div className="col-span-full flex min-h-[55vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-pink-50">
          <svg aria-hidden="true" className="h-20 w-20" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" fill="#FCE7F3" r="54" />
            <circle cx="45" cy="48" fill="#EC4899" opacity="0.25" r="12" />
            <circle cx="74" cy="44" fill="#EC4899" opacity="0.35" r="9" />
            <path d="M32 84c6-10 15-16 27-16s21 6 27 16" fill="none" stroke="#DB2777" strokeLinecap="round" strokeWidth="6" />
            <circle cx="51" cy="56" fill="#9D174D" r="2.4" />
            <circle cx="69" cy="56" fill="#9D174D" r="2.4" />
            <path d="M55 65c2.7 2 7.3 2 10 0" fill="none" stroke="#9D174D" strokeLinecap="round" strokeWidth="2.5" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-zinc-900">No profiles found yet</h3>
        <p className="mt-2 text-sm text-zinc-600">
          We could not find matching profiles for your current filters and location.
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Try different age range, country, or city filters to discover more people.
        </p>
      </div>
    </div>
  );
}
