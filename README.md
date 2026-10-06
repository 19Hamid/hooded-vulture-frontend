# BeakSpeak

A React + Vite chatbot and five-question hooded vulture quiz. The existing Habitat loss and Senegal answers are intentionally preserved.

## Run

Use Node 22.12 or later. Run `npm ci`, then `npm start`. The app opens on port 3000. For a local backend, copy `.env.example` to `.env.local` and set `REACT_APP_BACKEND_URL=http://localhost:3001`.

`REACT_APP_BACKEND_URL` accepts a base hostname or the full `/api/chat` endpoint. If omitted, it defaults to the production backend. Vercel's existing variable with the backend hostname continues to work. A changed build-time variable requires a new frontend deployment.

Run `npm test` for regressions and `npm run build` for the production build.

## Behaviour

Chat keeps up to 40 successful turns in the current tab's session storage and sends at most six complete turns (12,000 characters) as context. Clear chat resets both the transcript and the session identifier. Failed and stopped turns are never sent as conversation history; the last failed message can be retried or edited. Requests time out after 30 seconds and can be stopped. Mood changes apply to new messages; a retry uses the original mood.

Quiz answers lock after one selection. Next question lets the player read feedback at their own pace. The round and collected badges are saved in local storage; replay starts a new shuffled round while retaining badges. This is a casual local game, not a verified leaderboard.

The sidebar is removed from layout, keyboard navigation, and the accessibility tree when hidden. It starts closed on small screens and opens above the chat. Reduced-motion settings are respected.

## Deployment

The Node backend repository owns `/api/chat` and its Groq key. Deploy that backend before this frontend. Frontend preview origins on Hamid's existing Vercel team are allowed by the repaired backend. For another team or custom domain, configure backend `ALLOWED_ORIGINS` explicitly.

No provider secrets belong in this repository. Dependencies are installed from `package-lock.json`; do not commit `node_modules` or the old backend backup.

The build uses Vite and the regressions use Vitest. `vercel.json` explicitly selects the Vite framework and retains the `build` output directory. The previous Create React App toolchain has been removed.
