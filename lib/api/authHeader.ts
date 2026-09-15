import { fetchAuthSession } from "aws-amplify/auth";
import { throwSessionExpiredError } from "./clientError";

/**
 * Bearer header for routes that require a session (vs. `profileViewApi.ts`'s
 * `optionalAuthHeader` for the one public route). A missing token routes through the same
 * session-expired notification path as a real 401 (see clientError.ts).
 */
export async function authHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    return throwSessionExpiredError();
  }
  return { Authorization: `Bearer ${token}` };
}
