import { NextResponse } from "next/server";
import { listNvidiaModels } from "@/lib/nvidia";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  const models = await listNvidiaModels();
  return NextResponse.json({ models });
}
