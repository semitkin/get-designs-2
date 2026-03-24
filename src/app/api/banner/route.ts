import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildBannerPrompt } from "@/prompts/bannerHtml";
import { validateHeroDesign } from "@/lib/heroSchema";
import { validateDesignTokens } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("X-OpenAI-Key")?.trim() || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "No OpenAI API key provided. Open Settings and add your key." },
      { status: 401 }
    );
  }

  const openai = new OpenAI({ apiKey });

  let heroDesign: unknown;
  let designTokens: unknown;
  try {
    const body = await req.json();
    heroDesign = body?.heroDesign;
    designTokens = body?.designTokens ?? null;
    if (!heroDesign) {
      return NextResponse.json({ error: "Missing `heroDesign` field." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!validateHeroDesign(heroDesign)) {
    return NextResponse.json({ error: "Invalid `heroDesign` object." }, { status: 400 });
  }

  const validatedTokens = validateDesignTokens(designTokens) ? designTokens : null;

  const prompt = buildBannerPrompt(heroDesign, validatedTokens);

  let html: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    html = completion.choices[0]?.message?.content ?? "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OpenAI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Strip markdown code fences if the model wrapped the output anyway
  html = html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!html) {
    return NextResponse.json({ error: "Model returned empty output." }, { status: 500 });
  }

  return NextResponse.json({ html });
}
