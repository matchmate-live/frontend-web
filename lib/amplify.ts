import { Amplify } from "aws-amplify";

let configured = false;

// Read NEXT_PUBLIC_* vars as process.env.NAME directly. process.env[name] isn't inlined
// into the browser bundle and comes back empty.
export function configureAmplifyAuth() {
  if (configured) return true;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim() ?? "";
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim() ?? "";
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim() ?? "";
  const redirectSignIn = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN?.trim() ?? "";
  const redirectSignOut = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT?.trim() ?? "";

  if (!userPoolId || !userPoolClientId || !domain || !redirectSignIn || !redirectSignOut) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[amplify] Cognito env missing or empty. Check frontend-web/.env.local, use NEXT_PUBLIC_* names, restart `npm run dev`.",
      );
    }
    return false;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          oauth: {
            domain,
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [redirectSignIn],
            redirectSignOut: [redirectSignOut],
            responseType: "code",
          },
          email: true,
        },
      },
    },
  });

  configured = true;
  return true;
}

// Clears Amplify's saved auth state. A stuck Google redirect can leave a flag behind that
// blocks every later fetchAuthSession(), and a reload doesn't clear it.
export function resetAmplifyAuthState(): void {
  const prefixes = ["CognitoIdentityServiceProvider", "amplify-signin-with-hostedUI"];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && prefixes.some((p) => key.startsWith(p))) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) storage.removeItem(key);
  }
}
