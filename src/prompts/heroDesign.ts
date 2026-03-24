import { heroDesignJsonSchema } from "@/lib/heroSchema";

export function buildHeroPrompt(url: string): string {
  const schemaStr = JSON.stringify(heroDesignJsonSchema, null, 2);

  return `You are a design analyst. You visit the website and extract all visual and copy elements from its homepage that would allow another LLM to generate a new hero banner HTML/CSS section.

INPUT:
Website URL: ${url}

TASK:
Analyze the homepage and extract the following into a single JSON object. Return ONLY valid JSON — no prose, no markdown fences.

WHAT TO EXTRACT:

1. LOGO
   - description: Describe the logo (shape, style, typeface used, any iconography). If you can read the brand name, include it.
   - colors: List the main logo colors as hex codes (e.g. ["#CC0000", "#FFFFFF"])

2. HERO SECTION (the main above-the-fold banner)
   - headline: The primary headline text (exact wording)
   - subheadline: The supporting subtext below the headline (exact wording, or "" if none)
   - ctaText: The primary call-to-action button label (e.g. "Shop Now", "Get Started")
   - ctaColor: The CTA button background color as hex (observe the actual button color)
   - backgroundColor: The hero section background color as hex (dominant background)
   - layout: Describe the layout in 2–5 words (e.g. "full-width image left", "centered text overlay", "split 50/50 product photo")
   - imageDescription: Describe any hero image or illustration (subject, mood, style; or "none" if purely typographic)

3. TAGLINES
   - An array of all slogans, mottos, and taglines visible on the page (exact wording). Include promotional copy if clearly brand-defining.

4. TYPOGRAPHY
   - primaryFont: The primary typeface name if identifiable (e.g. "Helvetica Neue", "custom sans-serif")
   - headingStyle: Describe heading style in 3–6 words (e.g. "bold uppercase tight tracking", "large serif light weight")

5. VISUAL STYLE
   - A short phrase (4–8 words) describing the overall visual mood (e.g. "clean minimal white space premium", "bold colorful energetic retail", "warm earthy organic natural")

6. DOMINANT COLORS
   - An array of 2–4 hex color values that dominate the hero/above-the-fold area

RULES:
- Use ONLY colors and text you can actually observe on the page
- For hex colors, observe the real values — do not guess or use brand-book defaults
- If a field has no observable value, use "" for strings or [] for arrays
- Do not invent text that isn't on the page

OUTPUT FORMAT (STRICT):
Return ONLY this JSON object — no wrapper key, no extra fields:

{
  "logo": {
    "description": "...",
    "colors": ["#RRGGBB"]
  },
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "ctaText": "...",
    "ctaColor": "#RRGGBB",
    "backgroundColor": "#RRGGBB",
    "layout": "...",
    "imageDescription": "..."
  },
  "taglines": ["..."],
  "typography": {
    "primaryFont": "...",
    "headingStyle": "..."
  },
  "visualStyle": "...",
  "dominantColors": ["#RRGGBB"]
}

STRICT JSON SCHEMA (FOR VALIDATION):
${schemaStr}`;
}
