import type { HeroDesign } from "@/lib/heroSchema";
import type { DesignTokens } from "@/lib/schema";

export function buildBannerPrompt(
  heroDesign: HeroDesign,
  designTokens: DesignTokens | null
): string {
  const heroJson = JSON.stringify(heroDesign, null, 2);
  const tokensSection = designTokens
    ? `\nCOLOR DESIGN TOKENS (semantic palette extracted from the brand):\n${JSON.stringify(designTokens, null, 2)}\n`
    : "";

  // Pull key values out explicitly so they appear near their usage instructions
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

FONT SIZING — CALCULATE BEFORE WRITING CSS:
Before setting any font-size, count the total characters in your banner headline (including spaces and line breaks):
- Headline total chars ≤ 30 → headline clamp: (22px, 3.0vw, 42px)
- Headline total chars 31–50 → headline clamp: (20px, 2.6vw, 36px)
- Headline total chars 51–70 → headline clamp: (16px, 2.0vw, 28px)
- Headline total chars > 70 → headline clamp: (13px, 1.6vw, 22px)
Bullets: clamp at ~70% of headline max (e.g. if headline max is 36px, bullets max ≈ 25px).
CTA button: clamp at ~65% of headline max.
The goal: ALL content (headline on 2–3 lines, 3 bullets, CTA button) must fit within the 350px banner height with no overflow. When in doubt, choose the next tier down.

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
- Inner content: display: flex; align-items: center; height: 100% — no top/bottom padding on .gc-hero
- Font sizes: use clamp()

MOBILE RESPONSIVENESS (CRITICAL):
The @media block MUST be the very last rule inside the <style> tag — after ALL base styles.
If it appears before any base rule (e.g. .gc-hero__left), that base rule will override it and mobile will break.

Required @media block (place it last):
@media (max-width: 767px) {
  .gc-hero { height: 220px; }
  .gc-hero__right { display: none; }
  .gc-hero__left { width: 100%; padding-right: 7%; }
}

Do not omit any of these three declarations. Do not move this block above any base styles.

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
  .gc-hero__left {
    width: 55%; padding-left: 7%; display: flex; flex-direction: column;
    justify-content: center; gap: 12px; position: relative; z-index: 2;
  }
  .gc-hero__headline {
    /* Example headline "Give the Gift They Actually Want" = 33 chars → tier 31–50 → max 36px */
    font-size: clamp(20px, 2.6vw, 36px); font-weight: 700;
    color: #fff; line-height: 1.2; margin: 0;
  }
  .gc-hero__bullets {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 5px;
  }
  .gc-hero__bullets li {
    /* bullets ~70% of 36px max → ~25px max */
    font-size: clamp(13px, 1.5vw, 22px); color: rgba(255,255,255,0.9);
  }
  .gc-hero__bullets li::before { content: "✓ "; font-weight: 700; }
  .gc-hero__btn {
    display: inline-block; margin-top: 4px;
    background: #FFD700; color: #2D0060;
    padding: 11px 26px; border-radius: 50px;
    /* CTA ~65% of 36px max → ~23px max */
    font-size: clamp(12px, 1.4vw, 22px); font-weight: 700;
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
  /* @media MUST be last — after all base styles */
  @media (max-width: 767px) {
    .gc-hero { height: 220px; }
    .gc-hero__right { display: none; }
    .gc-hero__left { width: 100%; padding-right: 7%; }
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
