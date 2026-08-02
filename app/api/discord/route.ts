import { NextRequest, NextResponse } from "next/server";
import { generateReportPdf } from "@/lib/pdfGenerator";
import { sendReportToDiscord } from "@/lib/discord";
import type { ApplicantInfo, DiscordConfig, ResearchResult } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  result: ResearchResult;
  applicant: ApplicantInfo;
  discord: DiscordConfig;
}

export async function POST(req: NextRequest) {
  try {
    const { result, applicant, discord } = (await req.json()) as Body;

    if (!discord?.botToken || !discord?.channelId) {
      return NextResponse.json(
        { error: "Discord bot token and channel ID are required." },
        { status: 400 }
      );
    }
    if (!result?.company?.name) {
      return NextResponse.json(
        { error: "Invalid research result payload." },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateReportPdf(result);
    const outcome = await sendReportToDiscord(
      discord,
      applicant,
      result,
      pdfBuffer
    );

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discord send failed." },
      { status: 500 }
    );
  }
}
