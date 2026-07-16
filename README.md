# Gemini Clone frontend

React and Vite client for a streaming Gemini chat interface. Conversations are saved in the browser with `localStorage`; no API key is exposed to the client.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_BACKEND_URL` if the backend is not running on `http://localhost:5001`.
2. Run `npm install` and `npm run dev`.
3. In a second terminal, start the backend described in `../gemini-clone-backend/README.md`.

## Quality checks

Run `npm run lint` and `npm run build` before deploying.

## Included features

- Streaming responses and a stop button
- Local persistent multi-chat history
- Retry and copy response controls
- Keyboard-friendly controls and responsive layout

## Supabase chat sync

Authentication is configured in the client. To enable cloud chat history, run [the chat migration](supabase/migrations/001_create_chats.sql) once in **Supabase Dashboard → SQL Editor**. The next application update will connect signed-in users to these tables.
