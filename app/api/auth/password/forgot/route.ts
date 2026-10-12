import { proxyPublicPost } from "@/lib/api/proxy";

export const runtime = "nodejs";

// Emails a password reset code. Public: the user is signed out.
export async function POST(request: Request) {
  return proxyPublicPost(request, "/auth/password/forgot");
}
