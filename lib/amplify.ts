import { Amplify } from "aws-amplify";

let configured = false;

function read(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function configureAmplifyAuth() {
  if (configured) return true;

  const userPoolId = read("NEXT_PUBLIC_COGNITO_USER_POOL_ID");
  const userPoolClientId = read("NEXT_PUBLIC_COGNITO_CLIENT_ID");
  const domain = read("NEXT_PUBLIC_COGNITO_DOMAIN");
  const redirectSignIn = read("NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN");
  const redirectSignOut = read("NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT");

  if (!userPoolId || !userPoolClientId || !domain || !redirectSignIn || !redirectSignOut) {
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
