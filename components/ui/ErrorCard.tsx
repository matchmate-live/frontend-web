import UserRoundIcon from "@/icons/user-round.svg";

type ErrorCardProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

export default function ErrorCard({ title, message, actionLabel, onAction }: ErrorCardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm">
      <UserRoundIcon aria-hidden className="mx-auto h-10 w-10 text-pink-300" />
      <h2 className="mt-3 text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600" role="alert">
        {message}
      </p>
      <button
        className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-md bg-pink-300 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-400"
        type="button"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}
