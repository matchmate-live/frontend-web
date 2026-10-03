import { fetchAuthSession } from "aws-amplify/auth";
import { throwSessionExpiredError } from "./clientError";

// Bearer header for routes that need a signed-in user. No token is handled like a 401.
export async function authHeader(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    return throwSessionExpiredError();
  }
  return { Authorization: `Bearer ${token}` };
}
