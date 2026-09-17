/** Custom dropdown arrow for a `<select appearance-none>` — native arrows ignore padding
 * and always sit flush against the border in every browser, so this is the only reliable
 * way to control the spacing. Wrap the select in a `relative` container and place this
 * as a sibling. */
export default function SelectChevron() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
