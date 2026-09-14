// GET /api/status?id=REQUEST_ID
// Polls fal.ai for a submitted job and, once complete, returns the video URL.
const FAL_MODEL = process.env.FAL_MODEL || "fal-ai/pixverse/v5/text-to-video";

export async function GET(req) {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server is missing FAL_KEY." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("id");
  if (!requestId) {
    return Response.json({ error: "Missing request id." }, { status: 400 });
  }

  const authHeader = { Authorization: `Key ${apiKey}` };

  try {
    const statusRes = await fetch(
      `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}/status`,
      { headers: authHeader }
    );
    const statusData = await statusRes.json();

    if (!statusRes.ok) {
      return Response.json(
        { error: statusData?.detail || "Could not check job status." },
        { status: statusRes.status }
      );
    }

    if (statusData.status !== "COMPLETED") {
      // IN_QUEUE | IN_PROGRESS
      return Response.json({ status: statusData.status });
    }

    const resultRes = await fetch(
      `https://queue.fal.run/${FAL_MODEL}/requests/${requestId}`,
      { headers: authHeader }
    );
    const resultData = await resultRes.json();

    // Response shape varies slightly by model — most return { video: { url } }.
    const videoUrl = resultData?.video?.url || resultData?.video_url || null;

    if (!videoUrl) {
      return Response.json(
        { error: "Job completed but no video URL was returned by the provider." },
        { status: 502 }
      );
    }

    return Response.json({ status: "COMPLETED", videoUrl });
  } catch (err) {
    return Response.json({ error: "Could not reach the video provider." }, { status: 502 });
  }
}
