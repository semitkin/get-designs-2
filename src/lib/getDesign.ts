/**
 * Design analysis service — extracts brand design tokens and generates banner HTML
 * using OpenAI GPT-4o vision/analysis.
 *
 * Adapted from test-get-design/getDesign.ts for backend integration.
 */

import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorToken {
  value: string; // hex color, e.g. "#0057FF"
  label: string; // human-readable name, e.g. "Electric Blue"
}

export interface DesignTokens {
  primary: ColorToken;
  secondary: ColorToken;
  success: ColorToken;
  error: ColorToken;
  warning: ColorToken;
  info: ColorToken;
  neutral: ColorToken;
}

export interface HeroDesign {
  logo: {
    description: string;
    colors: string[];
  };
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaColor: string;
    backgroundColor: string;
    layout: string;
    imageDescription: string;
  };
  taglines: string[];
  typography: {
    primaryFont: string;
    headingStyle: string;
  };
  visualStyle: string;
  dominantColors: string[];
}

export interface DesignAnalysisResult {
  tokens: DesignTokens;
  heroDesign: HeroDesign;
  bannerHtml: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const TOKEN_KEYS: Array<keyof DesignTokens> = [
  "primary", "secondary", "success", "error", "warning", "info", "neutral",
];

function validateDesignTokens(data: unknown): data is DesignTokens {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  for (const key of TOKEN_KEYS) {
    const token = obj[key];
    if (typeof token !== "object" || token === null) return false;
    const t = token as Record<string, unknown>;
    if (typeof t.value !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(t.value)) return false;
    if (typeof t.label !== "string" || t.label.trim() === "") return false;
  }
  return true;
}

function validateHeroDesign(data: unknown): data is HeroDesign {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.logo !== "object" || obj.logo === null) return false;
  const logo = obj.logo as Record<string, unknown>;
  if (typeof logo.description !== "string") return false;
  if (!Array.isArray(logo.colors)) return false;

  if (typeof obj.hero !== "object" || obj.hero === null) return false;
  const hero = obj.hero as Record<string, unknown>;
  for (const f of ["headline", "subheadline", "ctaText", "ctaColor", "backgroundColor", "layout", "imageDescription"]) {
    if (typeof hero[f] !== "string") return false;
  }
  // Allow empty string when model couldn't extract a color
  const hexOrEmpty = /^(#[0-9A-Fa-f]{6})?$/;
  if (!hexOrEmpty.test(hero.ctaColor as string)) return false;
  if (!hexOrEmpty.test(hero.backgroundColor as string)) return false;

  if (!Array.isArray(obj.taglines)) return false;

  if (typeof obj.typography !== "object" || obj.typography === null) return false;
  const typo = obj.typography as Record<string, unknown>;
  if (typeof typo.primaryFont !== "string") return false;
  if (typeof typo.headingStyle !== "string") return false;

  if (typeof obj.visualStyle !== "string") return false;

  if (!Array.isArray(obj.dominantColors)) return false;
  for (const c of obj.dominantColors) {
    if (typeof c !== "string" || !hexOrEmpty.test(c)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const designTokensJsonSchema = {
  type: "object",
  required: ["primary", "secondary", "success", "error", "warning", "info", "neutral"],
  additionalProperties: false,
  properties: {
    primary: { $ref: "#/definitions/ColorToken" },
    secondary: { $ref: "#/definitions/ColorToken" },
    success: { $ref: "#/definitions/ColorToken" },
    error: { $ref: "#/definitions/ColorToken" },
    warning: { $ref: "#/definitions/ColorToken" },
    info: { $ref: "#/definitions/ColorToken" },
    neutral: { $ref: "#/definitions/ColorToken" },
  },
  definitions: {
    ColorToken: {
      type: "object",
      required: ["value", "label"],
      additionalProperties: false,
      properties: {
        value: { type: "string", description: "Hex color value, e.g. #0057FF", pattern: "^#[0-9A-Fa-f]{6}$" },
        label: { type: "string", description: "Human-readable color name, e.g. Electric Blue" },
      },
    },
  },
};

const heroDesignJsonSchema = {
  type: "object",
  required: ["logo", "hero", "taglines", "typography", "visualStyle", "dominantColors"],
  additionalProperties: false,
  properties: {
    logo: {
      type: "object",
      required: ["description", "colors"],
      additionalProperties: false,
      properties: {
        description: { type: "string" },
        colors: { type: "array", items: { type: "string" } },
      },
    },
    hero: {
      type: "object",
      required: ["headline", "subheadline", "ctaText", "ctaColor", "backgroundColor", "layout", "imageDescription"],
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        ctaText: { type: "string" },
        ctaColor: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        backgroundColor: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        layout: { type: "string" },
        imageDescription: { type: "string" },
      },
    },
    taglines: { type: "array", items: { type: "string" } },
    typography: {
      type: "object",
      required: ["primaryFont", "headingStyle"],
      additionalProperties: false,
      properties: {
        primaryFont: { type: "string" },
        headingStyle: { type: "string" },
      },
    },
    visualStyle: { type: "string" },
    dominantColors: { type: "array", items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" } },
  },
};

function buildColorTokensPrompt(url: string): string {
  const schemaStr = JSON.stringify(designTokensJsonSchema, null, 2);
  return `You are a design-token extractor. You visit the website and identify its real brand colors.

INPUT:
Website URL: ${url}

TASK:
1. Analyze the website's visual identity (logo, hero, nav, buttons, backgrounds, links)
2. Build a palette of the actual colors present on the site
3. Map those colors to the 7 semantic roles below
4. Return ONLY valid JSON — no prose, no markdown

STEP 1 — BUILD THE ACTUAL PALETTE:
Before assigning roles, list every distinct color you can observe on the page:
buttons, CTAs, nav bar, header, hero, banners, links, icons, backgrounds.
Rank them by visual area/frequency. The most-used color is primary.

STEP 2 — ASSIGN SEMANTIC ROLES:

* primary   — the color with the largest visual presence (most buttons, largest banners, dominant UI chrome). Ignore logo color if it contradicts what you see in the UI.
* secondary — the second most visually prominent brand color
* success   — use the brand's actual confirmation/positive color if present; otherwise adapt the nearest brand color toward green (shift hue, not copy Bootstrap)
* error     — use the brand's actual alert/danger color if present; otherwise adapt the nearest brand color toward red
* warning   — use the brand's actual caution color if present; otherwise adapt toward amber/orange from the palette
* info      — use the brand's actual informational color if present; otherwise adapt toward blue/teal from the palette
* neutral   — the dominant gray or muted tone used for text, borders, or backgrounds

RULES:
* NEVER copy Bootstrap/Material Design defaults. These are banned: #28A745, #DC3545, #FFC107, #17A2B8, #6C757D, #007BFF, #6610F2
* Base every token on a color you can actually observe on the page — not on prior knowledge of the brand
* For roles with no direct match, derive from the actual palette (adjust lightness or hue) — do not invent unrelated colors
* If the site has very few colors, it is acceptable for multiple tokens to be variations of the same hue
* label must be a short descriptive name (2–4 words), specific to this brand (e.g. "Chopper Green", not "Green")

OUTPUT FORMAT (STRICT):
Return ONLY this JSON object — no wrapper key, no extra fields:

{
  "primary":   { "value": "#RRGGBB", "label": "Brand Name Here" },
  "secondary": { "value": "#RRGGBB", "label": "Brand Name Here" },
  "success":   { "value": "#RRGGBB", "label": "Brand Name Here" },
  "error":     { "value": "#RRGGBB", "label": "Brand Name Here" },
  "warning":   { "value": "#RRGGBB", "label": "Brand Name Here" },
  "info":      { "value": "#RRGGBB", "label": "Brand Name Here" },
  "neutral":   { "value": "#RRGGBB", "label": "Brand Name Here" }
}

STRICT JSON SCHEMA (FOR VALIDATION):
${schemaStr}`;
}

function buildHeroDesignPrompt(url: string): string {
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

function buildBannerPrompt(heroDesign: HeroDesign, designTokens: DesignTokens | null): string {
  const brandName = heroDesign.logo.description || "the brand";
  const primaryColor = designTokens?.primary?.value || heroDesign.hero.backgroundColor || heroDesign.dominantColors?.[0] || "#2D2066";
  const secondaryColor = designTokens?.secondary?.value || heroDesign.hero.ctaColor || "#FFFFFF";
  const accentColor = designTokens?.warning?.value || heroDesign.dominantColors?.[1] || "#FFD700";
  const bgColor = heroDesign.hero.backgroundColor || primaryColor;
  const ctaColor = heroDesign.hero.ctaColor || accentColor;
  const headline = heroDesign.hero.headline || "The Perfect Gift";
  const subheadline = heroDesign.hero.subheadline || "";
  const fontHint = heroDesign.typography.primaryFont || "system sans-serif";
  const headingStyle = heroDesign.typography.headingStyle || "bold clean";
  const mood = heroDesign.visualStyle || "modern premium";
  const taglines = heroDesign.taglines.length > 0 ? heroDesign.taglines.map(t => `  - "${t}"`).join("\n") : "  (none)";
  const dominantColors = heroDesign.dominantColors.length > 0 ? heroDesign.dominantColors.join(", ") : bgColor;

  return `You are a world-class front-end designer. Generate a self-contained HTML+CSS hero banner snippet.

BRAND: ${brandName}
MOOD: ${mood}
FONT: ${fontHint} / ${headingStyle}

EXACT COLORS TO USE:
  background: ${bgColor}
  headline text: #FFFFFF
  bullet text: rgba(255,255,255,0.85)
  CTA button bg: ${ctaColor}
  CTA button text: #FFFFFF
  accent / decorative: ${accentColor}
  secondary: ${secondaryColor}
  dominant palette: ${dominantColors}

CONTENT BUDGET — FIXED SLOTS (do not add anything outside these):
  1. Headline — 1-2 lines, 3 max, do not force with max-width.
  2. Bullets — exactly 2-3 short lines (✓ marks), NO subheadline, NO extra paragraph
  3. CTA button — one line
  Do NOT include a subheadline or any additional text block. The subheadline reference below is only to inform brand voice — do not render it.

COPY — THIS IS A GIFT CARD BANNER, NOT A BRAND AD:
  Every line of copy must sell the idea of giving or receiving a ${brandName} gift card — not the brand's own products or services.
  The headline, bullets, and CTA must answer: "Why should I buy a ${brandName} gift card?" — not "Why should I shop at ${brandName}?"
  Good framing: gifting occasion, flexibility, instant delivery, making someone happy, the joy of choice.
  Bad framing: promoting the brand's current offer, sale, or product range as if the reader is a direct shopper.

  Headline — start from this brand line and rewrite it as a gift card pitch: "${headline}"
  Brand voice / subheadline reference (do NOT render — use only to inform tone): "${subheadline}"
  Brand taglines (use for tone and brand voice only — reframe any copy toward gift cards):
${taglines}
  CTA button text: "Shop ${brandName} Gift Cards" or a close variant — must mention gift cards explicitly
  Bullets: exactly 2-3 short lines (✓), each max 8 words, each about buying/giving a gift card — not about the brand's products

FONT SIZING — DO THIS CALCULATION BEFORE WRITING ANY CSS:
Count the total characters in your banner headline (including spaces and line breaks):
  ≤ 30 chars  → headline clamp(28px, 3.6vw, 54px) | bullets max ~38px | CTA max ~35px
  31–50 chars → headline clamp(26px, 3.2vw, 48px) | bullets max ~34px | CTA max ~31px
  51–70 chars → headline clamp(22px, 2.6vw, 40px) | bullets max ~28px | CTA max ~26px
  > 70 chars  → headline clamp(19px, 2.2vw, 34px) | bullets max ~24px | CTA max ~22px
Bullets: clamp at ~70% of headline max. CTA: clamp at ~65% of headline max.
GOAL: all 3 slots (headline + bullets + CTA) must fit within 350px height with no overflow. When in doubt, pick the next tier down.

LAYOUT:
  Left column: minimum 65% width. Do NOT make it narrower — a narrow column breaks the headline across too many lines and wastes height. Give the text room to breathe horizontally.
  Left column contains: headline (2-3 bold lines), bullets, CTA button — nothing else
  Right column: CSS-only decorative box (rounded rect, gift card shapes, or bold "GIFT" typography), positioned absolute on the right side
  The right box sits ON TOP of the background — it does NOT split or shrink the left column

NO LOGO OR BRAND NAME IN THE BANNER:
  Do NOT render a logo, logotype, wordmark, or brand name text anywhere in the banner.
  The parent page already displays the brand — adding it here would duplicate it. Leave it out entirely.

NO TRADEMARK SYMBOLS:
  Do NOT include ®, ™, or © anywhere in the banner — not in headlines, bullets, CTA, or decorative elements.

TEXT CONTRAST:
  All text must have sufficient contrast against the banner background.
  Do NOT place white or light-colored text on a light background (e.g. white on light grey, white on yellow, white on cream).
  If the background is light, use a dark text color (e.g. near-black or the brand's dark tone). If the background is dark, use white or a light neutral.
  Apply the same rule to bullet text and the CTA button label — check every text element against its direct background color.

STRICT CSS RULES:
  .gc-hero { width:100%; height:350px; overflow:hidden; position:relative; background: ${bgColor}; display:flex; align-items:center; font-family:'${fontHint}',sans-serif; }
  ALL selectors must start with .gc-hero (BEM: .gc-hero__headline, .gc-hero__btn, .gc-hero__right, etc.)
  Add a scoped reset at the top of the <style> block to protect against host-page styles leaking in:
    .gc-hero, .gc-hero * { box-sizing: border-box; margin: 0; padding: 0; border: 0; font: inherit; vertical-align: baseline; list-style: none; text-decoration: none; }
  Then re-declare every property you actually need on each element — never rely on browser or host-page defaults.
  NEVER use body, html, *, :root, or !important
  Use clamp() for all font-sizes
  The CTA <a> must have: onclick="window.scrollBy({top:300,behavior:'smooth'});return false;" and cursor:pointer
  NO @keyframes, NO animation, NO transition — completely static

MOBILE — CRITICAL @media PLACEMENT RULE:
The @media block MUST be the very last rule inside the <style> tag — after ALL base styles.
If it appears before any base rule, the base rule will override it and mobile will break.
Required block (place it last, do not omit any declaration):
  @media (max-width: 767px) {
    .gc-hero { height: 220px; }
    .gc-hero__right { display: none; }
    .gc-hero__left { width: 100%; padding-right: 7%; }
  }

OUTPUT:
  Return ONLY raw HTML starting with <style> then <div class="gc-hero">
  No markdown fences, no explanation, no wrapping
  The <style> block goes FIRST, then the HTML`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function getOpenAIClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

/**
 * Helper to extract text from a Responses API result.
 */
function extractResponseText(response: any): string {
  // response.output is an array of output items
  for (const item of response.output ?? []) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block.type === "output_text" && block.text) return block.text;
      }
    }
  }
  // Fallback: try output_text at top level
  if (response.output_text) return response.output_text;
  return "";
}

export async function extractColorTokens(url: string): Promise<DesignTokens> {
  const client = getOpenAIClient();
  const prompt = buildColorTokensPrompt(url);

  let raw: string;
  try {
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
      temperature: 0.2,
      text: { format: { type: "json_object" } },
    });
    raw = extractResponseText(response);
  } catch (err: unknown) {
    throw new Error(`OpenAI request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw}`);
  }

  if (!validateDesignTokens(parsed)) {
    throw new Error(`Model response did not match DesignTokens schema: ${raw}`);
  }

  return parsed;
}

export async function extractHeroDesign(url: string): Promise<HeroDesign> {
  const client = getOpenAIClient();
  const prompt = buildHeroDesignPrompt(url);

  let raw: string;
  try {
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
      temperature: 0.3,
      text: { format: { type: "json_object" } },
    });
    raw = extractResponseText(response);
  } catch (err: unknown) {
    throw new Error(`OpenAI request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Model returned invalid JSON: ${raw}`);
  }

  if (!validateHeroDesign(parsed)) {
    throw new Error(`Model response did not match HeroDesign schema: ${raw}`);
  }

  return parsed;
}

export async function generateBannerHtml(
  heroDesign: HeroDesign,
  designTokens?: DesignTokens
): Promise<string> {
  const client = getOpenAIClient();
  const prompt = buildBannerPrompt(heroDesign, designTokens ?? null);

  let html: string;
  try {
    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
      temperature: 0.6,
    });
    html = extractResponseText(response);
  } catch (err: unknown) {
    throw new Error(`OpenAI request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Strip markdown code fences if the model wrapped the output
  html = html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!html) {
    throw new Error("Model returned empty output.");
  }

  return html;
}

/**
 * Full pipeline: extract tokens + hero in parallel, then generate banner.
 */
export async function analyzeWebsite(url: string): Promise<DesignAnalysisResult> {
  const [tokens, heroDesign] = await Promise.all([
    extractColorTokens(url),
    extractHeroDesign(url),
  ]);

  const bannerHtml = await generateBannerHtml(heroDesign, tokens);

  return { tokens, heroDesign, bannerHtml };
}