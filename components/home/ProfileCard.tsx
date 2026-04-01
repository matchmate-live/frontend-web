import { SearchProfile } from "@/lib/search";

type ProfileCardProps = {
  profile: SearchProfile;
};

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <article className="rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{profile.name ?? "Unnamed profile"}</h3>
      <p className="mt-1 text-sm text-zinc-700">
        {[profile.age ? `${profile.age} yrs` : "", profile.gender, profile.city, profile.country]
          .filter(Boolean)
          .join(" • ")}
      </p>
      {profile.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-zinc-800">{profile.description}</p>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">No bio yet.</p>
      )}
    </article>
  );
}
