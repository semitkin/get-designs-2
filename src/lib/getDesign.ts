/**
 * getDesign — self-contained library for brand design extraction and banner generation.
 *
 * Dependencies: openai (npm install openai)
 * No framework dependencies — works in any TypeScript project.
 */

import OpenAI from "openai";

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
  if (!/^#[0-9A-Fa-f]{6}$/.test(hero.ctaColor as string)) return false;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hero.backgroundColor as string)) return false;

  if (!Array.isArray(obj.taglines)) return false;

  if (typeof obj.typography !== "object" || obj.typography === null) return false;
  const typo = obj.typography as Record<string, unknown>;
  if (typeof typo.primaryFont !== "string") return false;
  if (typeof typo.headingStyle !== "string") return false;

  if (typeof obj.visualStyle !== "string") return false;

  if (!Array.isArray(obj.dominantColors)) return false;
  for (const c of obj.dominantColors) {
    if (typeof c !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(c)) return false;
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
  const heroJson = JSON.stringify(heroDesign, null, 2);
  const tokensSection = designTokens
    ? `\nCOLOR DESIGN TOKENS (semantic palette extracted from the brand):\n${JSON.stringify(designTokens, null, 2)}\n`
    : "";

  const brandTaglines = heroDesign.taglines.length > 0
    ? heroDesign.taglines.map(t => `  - "${t}"`).join("\n")
    : "  (none extracted)";
  const heroHeadline = heroDesign.hero.headline || "(none extracted)";
  const heroSubheadline = heroDesign.hero.subheadline || "(none extracted)";
  const logoDescription = heroDesign.logo.description || "(none extracted)";
  const visualStyle = heroDesign.visualStyle || "(none extracted)";

  return `You are a world-class front-end designer specializing in high-converting e-commerce hero banners.

Your task: Generate a single self-contained HTML+CSS snippet for a gift card marketplace homepage hero banner. This banner will be injected into an existing website, so it must be fully isolated and must not break anything on the host page.

---

BRAND CONTEXT (extracted from the brand's website):
${heroJson}
${tokensSection}
---

WHAT TO BUILD:
A visually striking, brand-faithful, full-width hero banner for a gift card marketplace homepage.
- Evokes the brand's identity — colors, typography, visual style
- Sells gift cards with compelling, brand-specific copy
- Has ONE call-to-action button (see CTA BUTTON rules)
- Contains NO other links, no external images, no iframes

NO ANIMATIONS: Do NOT use @keyframes, animation, or transition properties anywhere. Completely static.

COPY RULES:
The following text was extracted directly from this brand's website — USE IT:

  Brand logo / name clue: ${logoDescription}
  Original hero headline: ${heroHeadline}
  Original hero subheadline: ${heroSubheadline}
  Brand taglines / mottos:
${brandTaglines}
  Visual style / mood: ${visualStyle}

Instructions:
- Determine the brand name from the logo description or headline above
- The banner headline MUST reference this specific brand — include the brand name or a direct echo of their actual tagline/headline. Do not write generic copy.
- Headline must be 2–3 lines, large, bold. It should feel like it was written by that brand's own marketing team — for gift cards.
- Write 2–3 short benefit bullets (✓) that feel specific to this brand and its customers (draw from the taglines, visual style, and brand voice above)
- The CTA button label should be action-oriented and brand-relevant (e.g. "Shop [BrandName] Gift Cards")

LAYOUT — FOLLOW EXACTLY (do not center the text):
The banner uses a LEFT TEXT + RIGHT DECORATIVE BOX layout:

Left column (~55% width): contains the text group
- Brand headline (2–3 lines, large bold)
- 2–3 benefit bullets with ✓ checkmarks
- CTA button

Right column: a visually rich CONTAINED BOX positioned absolutely on the right side
- This box floats ON TOP of the background — it does NOT split the background
- Shape: rounded rectangle (border-radius: 16px) or overlapping circles
- Fill: a lighter or contrasting brand color (not the same as the background)
- Inside the box: creative CSS-only decoration — choose ONE of:
  a) A large bold typographic element (e.g. "GIFT", a big "$", or a price like "from $10") in a contrasting color
  b) 2–3 stacked/overlapping CSS rectangles styled like gift cards (rounded, border, slight rotation)
  c) A large outlined circle with a brand-relevant symbol or number inside

VISUAL STYLE:
- Background: brand's primary/dominant color, can use a subtle radial or linear gradient
- Typography: use the brand's font if it's a standard Google Font (load via <link>); otherwise use a clean system sans-serif
- The CTA button must match the brand's button style: color = brand CTA color, border-radius matching brand style
- Text on the left must have enough contrast against the background

CTA BUTTON (CRITICAL — follow exactly):
- Must be an <a> tag with this exact onclick:
  onclick="window.scrollBy({top:300,behavior:'smooth'});return false;"
- Do NOT use href="#products" or any other href
- Add cursor: pointer to its CSS

ISOLATION RULES (CRITICAL):
- Single root element: <div class="gc-hero">
- ALL CSS inside a <style> tag at the top of the snippet
- Every selector MUST start with .gc-hero — e.g. .gc-hero__headline, .gc-hero__btn
- NEVER use: body, html, *, :root, or any global selector
- NEVER use !important
- Fonts: load via <link rel="stylesheet"> embedded in the snippet

SIZE — FOLLOW EXACTLY:
- Desktop: width: 100%; height: 350px; overflow: hidden
- Mobile (max-width: 767px): height: 220px — hide or shrink the right box
- Inner content: display: flex; align-items: center; height: 100% — no top/bottom padding on .gc-hero
- Font sizes: use clamp()

OUTPUT FORMAT (STRICT):
- Return ONLY the raw HTML — no markdown fences, no explanation
- Start with <link> (if font) or <style>

EXAMPLE STRUCTURE (illustrates the layout pattern — adapt everything to the brand):
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap">
<style>
  .gc-hero {
    width: 100%; height: 350px; overflow: hidden; position: relative;
    background: #5B2D8E; display: flex; align-items: center;
    font-family: 'Montserrat', sans-serif;
  }
  @media (max-width: 767px) {
    .gc-hero { height: 220px; }
    .gc-hero__right { display: none; }
  }
  .gc-hero__left {
    width: 55%; padding-left: 7%; display: flex; flex-direction: column;
    justify-content: center; gap: 12px; position: relative; z-index: 2;
  }
  .gc-hero__headline {
    font-size: clamp(22px, 2.8vw, 36px); font-weight: 700;
    color: #fff; line-height: 1.2; margin: 0;
  }
  .gc-hero__bullets {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 6px;
  }
  .gc-hero__bullets li {
    font-size: clamp(13px, 1.2vw, 15px); color: rgba(255,255,255,0.9);
  }
  .gc-hero__bullets li::before { content: "✓ "; font-weight: 700; }
  .gc-hero__btn {
    display: inline-block; margin-top: 4px;
    background: #FFD700; color: #2D0060;
    padding: 12px 28px; border-radius: 50px;
    font-size: clamp(13px, 1.2vw, 15px); font-weight: 700;
    text-decoration: none; cursor: pointer; align-self: flex-start;
  }
  .gc-hero__right {
    position: absolute; right: 4%; top: 50%; transform: translateY(-50%);
    width: 34%; height: 82%; border-radius: 16px;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .gc-hero__right-inner {
    font-size: clamp(60px, 8vw, 110px); font-weight: 900;
    color: rgba(255,255,255,0.25); line-height: 1; text-align: center;
    letter-spacing: -2px;
  }
</style>
<div class="gc-hero">
  <div class="gc-hero__left">
    <h2 class="gc-hero__headline">Give the Gift<br>They Actually Want</h2>
    <ul class="gc-hero__bullets">
      <li>Delivered instantly by email or print</li>
      <li>Choose any amount, any occasion</li>
      <li>Redeemable in-store and online</li>
    </ul>
    <a class="gc-hero__btn" onclick="window.scrollBy({top:300,behavior:'smooth'});return false;">Shop Gift Cards</a>
  </div>
  <div class="gc-hero__right">
    <div class="gc-hero__right-inner">GIFT</div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract 7 semantic brand color tokens from a website URL.
 */
export async function extractColorTokens(
  url: string,
  openaiApiKey: string
): Promise<DesignTokens> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const prompt = buildColorTokensPrompt(url);

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

/**
 * Extract hero design elements (headline, CTA, colors, typography, etc.) from a website URL.
 */
export async function extractHeroDesign(
  url: string,
  openaiApiKey: string
): Promise<HeroDesign> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const prompt = buildHeroDesignPrompt(url);

  let raw: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    raw = completion.choices[0]?.message?.content ?? "";
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

/**
 * Generate an isolated HTML+CSS gift card hero banner based on extracted brand data.
 * designTokens is optional — pass it for better color fidelity.
 */
export async function generateBannerHtml(
  heroDesign: HeroDesign,
  openaiApiKey: string,
  designTokens?: DesignTokens
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const prompt = buildBannerPrompt(heroDesign, designTokens ?? null);

  let html: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    html = completion.choices[0]?.message?.content ?? "";
  } catch (err: unknown) {
    throw new Error(`OpenAI request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Strip markdown code fences if the model wrapped the output anyway
  html = html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!html) {
    throw new Error("Model returned empty output.");
  }

  return html;
}
