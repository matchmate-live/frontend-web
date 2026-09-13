import AdSlot from "@/components/ads/AdSlot";

type AdRailProps = {
  slot: string;
};

export default function AdRail({ slot }: AdRailProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 min-h-[calc(100vh-7rem)] rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
        <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
        <AdSlot className="mx-auto block rounded-md bg-pink-50/50" slot={slot} size={{ width: 250, height: 600 }} />
      </div>
    </aside>
  );
}
