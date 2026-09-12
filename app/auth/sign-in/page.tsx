import AuthCard from "@/components/auth/AuthCard";

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.next;
  const nextHref = typeof raw === "string" ? raw : undefined;
  return <AuthCard mode="signIn" nextHref={nextHref} />;
}
