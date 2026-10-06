# Deploy the frontend

The live app uses two Vercel projects: this React frontend and the [Node backend](https://github.com/19Hamid/hooded-vulture-backend).

## Deploy the API first

Follow the [backend deployment guide](https://github.com/19Hamid/hooded-vulture-backend/blob/main/docs/DEPLOYMENT.md). Confirm a real `POST /api/chat` request returns a reply.

## Import the frontend

Import `19Hamid/hooded-vulture-frontend` into Vercel. The checked-in `vercel.json` defines:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Install command | `npm ci --include=dev` |
| Build command | `npm run build` |
| Output directory | `build` |
| Node.js | 22.x or a compatible later version |

## Set the API URL

Add `REACT_APP_BACKEND_URL` in the intended Vercel environments:

```dotenv
REACT_APP_BACKEND_URL=https://your-backend.vercel.app
```

A URL ending in `/api/chat` also works. This is public configuration included in the browser bundle.

Use a branch-specific Preview value to test a frontend branch against its backend preview. Keep Production pointed at the production API. Redeploy after changing a build-time value.

## Allow the frontend origin

The backend accepts the live BeakSpeak origin and its existing team's BeakSpeak frontend preview URLs.

For another team or a custom domain, add the frontend's exact origin to backend `ALLOWED_ORIGINS`, separated by commas. Include the scheme and omit a trailing slash.

```dotenv
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.example
```

Redeploy the backend after changing its configuration.

## Verify the release

1. Send a short chat message and ask a follow-up.
2. Switch personality and send another message.
3. Answer a quiz question and check that choices lock and the score updates once.
4. Reload and confirm completed chat turns and quiz progress remain.
5. Clear chat and confirm the welcome message returns.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API root returns 404 | Chat must use `/api/chat` |
| Browser reports CORS failure | The exact origin and backend allowlist |
| Old API URL is still used | Rebuild after the environment-variable change |
| Chat reports a configuration problem | Backend key, model access and runtime-log error code |
| Local chat cannot connect | Backend is running on port 3001 |

Use the reference displayed by the chat error to locate its request in backend runtime logs.

Official reference: [Vercel environment variables](https://vercel.com/docs/environment-variables).
