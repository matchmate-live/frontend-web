This is the MatchMate.live web frontend built with Next.js App Router + TypeScript.

## Getting Started

1) Copy env values:

```bash
cp .env.example .env.local
```

2) Fill Cognito values from backend stack outputs:

- `CognitoUserPoolId`
- `CognitoUserPoolClientId`
- `CognitoHostedUiDomain`
- `HttpApiUrl`

3) Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth routes

- `/auth/sign-up`: email/password sign-up and Google sign-up
- `/auth/confirm`: confirm Cognito email code
- `/auth/sign-in`: email/password sign-in and Google sign-in
- `/auth/callback`: OAuth redirect callback for Cognito Hosted UI

## Notes

- This project uses `aws-amplify` for Cognito auth.
- Backend JWT authorizer accepts tokens issued by the same user pool/client.
