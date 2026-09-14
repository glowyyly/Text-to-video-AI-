// POST /api/generate
// Submits a text prompt + aspect ratio to a fal.ai video model and returns
// a request id the client can poll via /api/status.
//
// Requires FAL_KEY in your environment (.env.local). Get one at https://fal.ai
//
// FAL_MODEL controls which model handles the job. Pick one that supports
// text-to-video + your target aspect ratios from https://fal.ai/models
// (as of writing, PixVerse v5, MiniMax H3 and Kling all qualify — confirm
// the exact model slug and its input schema on fal.ai before going live,
// since providers rename/version these routes over time).
const FAL_MODEL = process.env.FAL_MODEL || "fal-ai/pixverse/v5/text-to-video";

const ALLOWED_RATIOS = ["16:9", "9:16", "1:1"];

export async function POST(req) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing FAL_KEY. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const aspectRatio = body.aspectRatio;

  if (!prompt) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }
  if (!ALLOWED_RATIOS.includes(aspectRatio)) {
    return Response.json({ error: "Unsupported aspect ratio." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: data?.detail || data?.error || "Video provider rejected the request." },
        { status: res.status }
      );
    }

    // fal's queue API returns request_id plus status/response urls we
    // re-derive on the status route rather than trusting client-supplied urls.
    return Response.json({ requestId: data.request_id });
  } catch (err) {
    return Response.json({ error: "Could not reach the video provider." }, { status: 502 });
  }
}
