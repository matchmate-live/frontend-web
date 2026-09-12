import { Amplify } from "aws-amplify";

let configured = false;

/**
 * NEXT_PUBLIC_* vars must be read with static `process.env.NEXT_PUBLIC_*` expressions.
 * Dynamic access like `process.env[name]` is not inlined into the client bundle, so values
 * from `.env.local` would always appear empty in the browser.
 */
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
