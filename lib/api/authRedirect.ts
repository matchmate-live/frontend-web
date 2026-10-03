import { ApiError } from "./clientError";

// True if this error showed the session-expired toast, so the caller can skip its own error
// message. Not the same as any 401: signed-out visitors get 401s too.
export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof ApiError && err.sessionExpiredNotified;
}
