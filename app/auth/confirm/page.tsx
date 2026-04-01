import AuthCard from "@/components/auth/AuthCard";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawEmail = params.email;
  const email = typeof rawEmail === "string" ? rawEmail : "";

  return (
    <>
      {email && (
        <p className="mx-auto mt-8 w-full max-w-md px-6 text-sm text-black/70">
          Confirming account for <span className="font-medium">{email}</span>
        </p>
      )}
      <AuthCard mode="confirm" initialEmail={email} />
    </>
  );
}
