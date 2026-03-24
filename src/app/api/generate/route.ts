import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt } from "@/prompts/colorTokens";
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

  const prompt = buildPrompt(url);

  let raw: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OpenAI request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON.", raw }, { status: 500 });
  }

  if (!validateDesignTokens(parsed)) {
    return NextResponse.json(
      { error: "Model response did not match the expected schema.", raw },
      { status: 500 }
    );
  }

  return NextResponse.json({ designTokens: parsed, raw });
}
