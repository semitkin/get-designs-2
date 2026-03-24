import { NextRequest, NextResponse } from "next/server";
import { generateBannerHtml } from "@/lib/getDesign";
import type { HeroDesign, DesignTokens } from "@/lib/getDesign";

export async function POST(req: NextRequest) {
  let heroDesign: HeroDesign;
  let designTokens: DesignTokens | undefined;
  try {
    const body = await req.json();
    if (!body?.heroDesign) {
      return NextResponse.json({ error: "Missing `heroDesign` field." }, { status: 400 });
    }
    heroDesign = body.heroDesign as HeroDesign;
    designTokens = body.designTokens ?? undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const html = await generateBannerHtml(heroDesign, designTokens);
    return NextResponse.json({ html });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
