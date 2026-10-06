# BeakSpeak

An educational chatbot and quiz about hooded vultures, built as a first-year AI degree project.

Ask questions, choose the assistant's tone and test your knowledge in a five-question quiz.

**[Live app](https://beakspeak-chatbot.vercel.app/)** · **[Node backend](https://github.com/19Hamid/hooded-vulture-backend)** · **[Deployment guide](docs/DEPLOYMENT.md)**

<img src="src/assets/images/normal.webp" alt="BeakSpeak vulture mascot" width="160">

## Features

- Three assistant personalities: calm, playful and strict.
- Follow-up questions with recent conversation context.
- Stop, retry, edit and clear controls for chat messages.
- A shuffled quiz with feedback, scores and collectible badges.
- A collapsible game panel, keyboard controls, accessible labels and reduced-motion support.

## How it works

| Part | Responsibility |
| --- | --- |
| React frontend | Chat interface, mood selection and quiz |
| Node.js API on Vercel | Request validation, Groq calls and error handling |
| Groq | Hosted language-model inference |
| Browser storage | The current tab's chat and the browser's quiz progress |

The frontend calls `POST /api/chat` in the separate Node backend. The Groq API key stays on the server. The backend chooses the model; the default is `openai/gpt-oss-20b`.

The [Python backend](https://github.com/19Hamid/python-backend) is a separate implementation. The live app uses the Node.js API.

## Run locally

Requirements: **Node.js 22.12 or later** and npm.

```bash
git clone https://github.com/19Hamid/hooded-vulture-frontend.git
cd hooded-vulture-frontend
npm ci
cp .env.example .env.local
```

For a local API, set this value in `.env.local`:

```dotenv
REACT_APP_BACKEND_URL=http://localhost:3001
```

Start the [Node backend](https://github.com/19Hamid/hooded-vulture-backend#run-locally) in a second terminal, then run:

```bash
npm start
```

Open **http://localhost:3000**. The quiz works without an API key; chat needs a configured backend.

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server on port 3000 |
| `npm test` | Run the frontend regression tests |
| `npm run build` | Create a production build in `build/` |
| `npm run preview` | Preview the latest production build |

Tests use Vitest and React Testing Library and cover chat history, cancellation, retries, input handling, quiz scoring and persistence.

## Configuration

`REACT_APP_BACKEND_URL` accepts a base URL or a full `/api/chat` URL. It defaults to `https://hooded-vulture-backend.vercel.app`.

The value is embedded at build time. Restart the development server or redeploy after changing it. Provider keys belong in the backend's environment variables.

## Data and current limits

- Messages and recent context are sent to the Node API and Groq to generate replies.
- Up to 40 completed turns are saved in the current tab's `sessionStorage`.
- Each request includes at most six complete previous turns and 12,000 characters of context.
- Quiz progress and unique badges are saved in `localStorage`. Replay resets the round and keeps earned badges.
- Clear chat removes the transcript and creates a new anonymous session identifier.
- AI answers are generated rather than checked against a curated knowledge base. Quiz questions are maintained manually.
- Scores belong to the local browser. There are no user accounts or verified leaderboards.
- Backend usage controls depend on deployment configuration; see [usage limits](https://github.com/19Hamid/hooded-vulture-backend#usage-limits).

## Project structure

| Path | Contents |
| --- | --- |
| `src/App.jsx` | Chat interface and request lifecycle |
| `src/chat.js` | Endpoint configuration, history, storage and errors |
| `src/MiniGames.jsx` | Quiz interface |
| `src/quiz.js` | Questions, shuffle, scoring and saved progress |
| `src/assets/images/` | WebP mascot images |
| `src/*.test.jsx` | Frontend regression tests |
| `vite.config.js` | Vite build and Vitest configuration |
| `vercel.json` | Vercel build settings |

## Contributing

Open an issue or pull request with a clear description and reproduction steps. Run `npm test` and `npm run build` before submitting changes.

Created by [Hamid](https://github.com/19Hamid).
