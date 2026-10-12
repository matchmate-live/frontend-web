// Carries the typed email from one auth page to the next (sign-in ⇄ forgot password) without
// putting it in the URL, where it would end up in history, logs and analytics. Read once,
// then cleared.

const KEY = "matchmate:auth-email";

export function handOffEmail(email: string): void {
  try {
    const value = email.trim();
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the next page just starts with an empty field.
  }
}

export function takeHandedOffEmail(): string {
  try {
    const value = sessionStorage.getItem(KEY) ?? "";
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return "";
  }
}
