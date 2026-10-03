import { hadSession, markHadSession } from "@/lib/auth/sessionFlag";

type ApiErrorBody = { message?: string };

// Gets the error message from a failed response, with a fallback for non-JSON bodies.
export async function readApiErrorMessage(
  res: Response,
  fallback: string = `Request failed (${res.status})`,
): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return typeof data.message === "string" && data.message ? data.message : fallback;
}

// Thrown on a failed API response, with the HTTP status.
export class ApiError extends Error {
  status: number;
  // True if this error showed the "session expired" toast. Not the same as a 401:
  // signed-out visitors get 401s without the toast.
  sessionExpiredNotified: boolean;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.sessionExpiredNotified = false;
  }
}

type SessionExpiredListener = () => void;
let sessionExpiredListener: SessionExpiredListener | null = null;

// Set by ToastProvider. All 401s go through the helpers below, so this is the one place
// that decides whether to show the toast.
export function setSessionExpiredListener(listener: SessionExpiredListener | null): void {
  sessionExpiredListener = listener;
}

// A 401 only means "session expired" if the user was actually signed in. Clear the flag
// right away so several failing requests show one toast.
function notifyIfSessionExpired(err: ApiError): void {
  if (err.status !== 401) return;
  if (!hadSession()) return;
  markHadSession(false);
  err.sessionExpiredNotified = true;
  sessionExpiredListener?.();
}

// Throws an ApiError with the response's message. 401s can trigger the session toast.
export async function throwApiError(res: Response, fallback?: string): Promise<never> {
  const err = new ApiError(res.status, await readApiErrorMessage(res, fallback));
  notifyIfSessionExpired(err);
  throw err;
}

// For when there's no token at all. Handled the same way as a 401.
export function throwSessionExpiredError(
  message = "Your session has expired. Please sign in again.",
): never {
  const err = new ApiError(401, message);
  notifyIfSessionExpired(err);
  throw err;
}
