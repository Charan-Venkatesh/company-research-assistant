import { NextRequest, NextResponse } from "next/server";
import { generateReportPdf } from "@/lib/pdfGenerator";
import type { ResearchResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = (await req.json()) as ResearchResult;
    if (!result?.company?.name) {
      return NextResponse.json(
        { error: "Invalid research result payload." },
        { status: 400 }
      );
    }

    const pdfBuffer = await generateReportPdf(result);
    const filename = `${result.company.name.replace(/[^a-z0-9]+/gi, "_")}_report.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed." },
      { status: 500 }
    );
  }
}
