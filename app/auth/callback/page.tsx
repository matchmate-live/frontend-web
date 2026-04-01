"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";
import { configureAmplifyAuth } from "@/lib/amplify";

export default function AuthCallbackPage() {
  const isConfigured = configureAmplifyAuth();
  const router = useRouter();
  const [status, setStatus] = useState("Finishing sign-in...");

  useEffect(() => {
    async function complete() {
      if (!isConfigured) {
        setStatus("Missing Cognito env values. Configure .env.local first.");
        return;
      }
      try {
        const session = await fetchAuthSession();
        if (session.tokens?.accessToken) {
          router.replace("/");
          return;
        }
        setStatus("No session was created. Try signing in again.");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "OAuth callback failed.");
      }
    }

    void complete();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <p className="text-sm text-black/70">{status}</p>
    </main>
  );
}
