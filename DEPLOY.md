# Deploying to Render

`render.yaml` sets up four things on Render: the API server (Docker), the website (Next.js), a Postgres database and a
Redis (Key Value). Three more services are used from outside Render: Qdrant, Inngest and Cloudinary.

## 1. Accounts and keys to have ready

| Service | What for | What you need |
|---|---|---|
| Render | Hosting | An account with the repo connected |
| OpenAI | Models and embeddings | `OPENAI_API_KEY` |
| Qdrant Cloud | Question-bank search | A cluster: `QDRANT_URL`, `QDRANT_API_KEY`. The collection is created on first use. |
| Inngest Cloud | Background jobs | An app: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
| Cloudinary | Stored PDFs and images | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The free plan refuses files over 10 MB. |
| Resend | Sign-up and password emails | `EMAIL_API_KEY` |
| Mistral, Mem0 | Optional | `MISTRAL_API_KEY`, `MEM0_API_KEY` |

## 2. Create it on Render

1. Render dashboard: New, then Blueprint, pick this repo and the branch to deploy.
2. Render reads `render.yaml` and asks for each value marked `sync: false`. Fill in the keys above. Leave
   `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` empty for now; they need the addresses Render is about to create.
3. Wait for the first deploy. The server runs the database migrations each time it starts, then starts.

## 3. Connect the two halves

After the first deploy, both services have an address like `https://mockexam-server.onrender.com`.

1. On the **server**, set `FRONTEND_URL` to the website's address (no trailing slash). This is used for CORS.
2. On the **website**, set `NEXT_PUBLIC_API_URL` to the server's address **plus `/api`**, for example
   `https://mockexam-server.onrender.com/api`. It is baked in at build time, so trigger a new deploy of the website
   afterwards.
3. In Inngest Cloud, sync the app with the server's address plus `/api/inngest`
   (for example `https://mockexam-server.onrender.com/api/inngest`). Do not set `INNGEST_DEV`.

## 4. Check it works

- `https://<server>/health` returns `{"ok":true}`.
- Register and sign in on the website, then sign out and check you are really signed out.
- Upload a PDF to the question bank and wait for it to finish processing.
- Open an AI chat and check the reply appears as it is written.

## Things to know

- **Free plans sleep.** A free web service stops after 15 minutes without traffic and takes about a minute to wake. The
  first request after that is slow, and a background job from Inngest may need a retry.
- **The free database is deleted 30 days after it is created.** Change its plan in the Render dashboard before real data
  goes in.
- **Free web services use a shared pool of 750 hours a month.** Two services awake all month use more than that.
- The sign-in cookie is `Secure` and `SameSite=None`, so the website and the API can be on different domains, but only
  over HTTPS (Render provides it).
- Nothing here sends traces or metrics anywhere yet. Logs are in the Render dashboard for each service.
