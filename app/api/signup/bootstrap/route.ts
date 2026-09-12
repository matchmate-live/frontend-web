import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/api/serverEnv";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiBaseUrl = serverEnv("API_BASE_URL");
  const secret = serverEnv("SIGNUP_BOOTSTRAP_SECRET");
  if (!apiBaseUrl || !secret) {
    return NextResponse.json(
      { message: "Server is missing API_BASE_URL or SIGNUP_BOOTSTRAP_SECRET." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const response = await fetch(new URL("/signup/bootstrap", apiBaseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-matchmate-signup-secret": secret,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Unable to reach signup service." }, { status: 502 });
  }
}
