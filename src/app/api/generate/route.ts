import { NextRequest, NextResponse } from "next/server";
import { extractColorTokens } from "@/lib/getDesign";

export async function POST(req: NextRequest) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing or invalid `url` field." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const designTokens = await extractColorTokens(url);
    return NextResponse.json({ designTokens });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
