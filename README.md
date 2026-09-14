[README.md](https://github.com/user-attachments/files/32204488/README.md)
# Reel — text to video

A single-prompt text-to-video generator. Pick 16:9, 9:16, or 1:1, describe
the shot, and it renders through fal.ai's video API.

## Setup

1. `npm install`
2. Sign up at https://fal.ai, create an API key, and copy `.env.local.example`
   to `.env.local`, filling in `FAL_KEY`.
3. On fal.ai's model catalog, confirm which text-to-video model you want
   (PixVerse, MiniMax H3, Kling, etc. all support 16:9/9:16/1:1) and its exact
   model slug + input field names, then set `FAL_MODEL` in `.env.local` to
   match. The starter code assumes an input shape of `{ prompt, aspect_ratio }`
   and an output of `{ video: { url } }` — adjust `src/app/api/generate/route.js`
   and `src/app/api/status/route.js` if your chosen model's schema differs.
4. `npm run dev` and open http://localhost:3000

## Deploying

This is a standard Next.js app — deploy to Vercel (`vercel deploy`) or any
Node host. Set `FAL_KEY` and `FAL_MODEL` as environment variables on the
host; never expose `FAL_KEY` to the browser (it's only read in the `api/`
route handlers, which run server-side).

## How it works

- `src/app/page.js` — the UI: prompt box, aspect ratio picker, live preview
- `src/app/api/generate/route.js` — submits the job to fal.ai, returns a request id
- `src/app/api/status/route.js` — polls fal.ai until the video is ready
