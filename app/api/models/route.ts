import { NextResponse } from "next/server";
import { listOpenRouterModels } from "@/lib/openrouter";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  const models = await listOpenRouterModels();
  return NextResponse.json({ models });
}
