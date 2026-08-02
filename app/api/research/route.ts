import { NextRequest } from "next/server";
import { runResearchPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { input, model } = await req.json();

  if (!input || typeof input !== "string") {
    return new Response(JSON.stringify({ error: "Missing input" }), {
      status: 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        const result = await runResearchPipeline(
          input,
          model || "openai/gpt-4o-mini",
          {
            onProgress: (step, status, detail) =>
              send("progress", { step, status, detail }),
          }
        );
        send("result", result);
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
