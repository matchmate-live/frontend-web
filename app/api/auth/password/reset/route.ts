import { proxyPublicPost } from "@/lib/api/proxy";

export const runtime = "nodejs";

// Sets a new password with the emailed code. Public: the user is signed out.
export async function POST(request: Request) {
  return proxyPublicPost(request, "/auth/password/reset");
}
