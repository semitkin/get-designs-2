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

  return `You are a world-class front-end designer specializing in high-converting e-commerce hero banners.

Your task: Generate a single self-contained HTML+CSS snippet for a gift card marketplace homepage hero banner. This banner will be injected into an existing website, so it must be fully isolated and must not break anything on the host page.

---

BRAND CONTEXT (extracted from the brand's website):
${heroJson}
${tokensSection}
---

WHAT TO BUILD:
A visually stunning, brand-faithful, full-width hero banner that:
1. Evokes the brand's identity — colors, typography mood, visual style, taglines
2. Sells gift cards — the copy should make visitors want to buy gift cards from/for this brand
3. Has ONE call-to-action: an anchor link <a href="#products"> that scrolls down to the product grid below
4. Contains NO other links, no external images, no iframes

CREATIVE DIRECTION:
- Study the brand's visual style and dominant colors — recreate that energy with CSS only
- Use CSS gradients, geometric shapes, pseudo-elements (::before, ::after), clip-path, or SVG inline shapes for visual richness
- Typography: use the brand's font if it's a Google Font (load it via <link>); otherwise use a harmonious system font stack
- The headline and subheadline should be original, creative gift card selling copy inspired by the brand's actual taglines and voice
- The CTA button should look exactly like the brand's buttons: shape, color, text style
- Add motion: subtle CSS animations (fade-in, float, shimmer) to make it feel alive
- Make it feel like it belongs on that brand's own website — not a generic template

ISOLATION RULES (CRITICAL — do not break the host page):
- Wrap everything in a single root element: <div class="gc-hero"> or <section class="gc-hero">
- Put ALL CSS inside a <style> tag at the very top of the snippet, before the HTML
- Every CSS selector MUST start with .gc-hero (e.g. .gc-hero__headline, .gc-hero__btn)
- NEVER use: body, html, *, :root, or any global reset
- NEVER use !important
- Use only relative/scoped selectors so nothing bleeds outside .gc-hero
- Fonts: load Google Fonts via a <link rel="stylesheet"> tag embedded in the snippet (not in <head>)

LAYOUT & RESPONSIVENESS:
- Full-width (width: 100%), height: clamp(380px, 50vw, 640px)
- Must look great at 320px wide and 1440px wide
- Use flexbox or grid for layout
- Use clamp() for font sizes and spacing

OUTPUT FORMAT (STRICT):
- Return ONLY the raw HTML snippet — no markdown code fences, no explanation, no prose
- Start directly with the <link> tag (if loading a font) or the <style> tag
- The snippet must be copy-paste ready to inject as an HTML block

EXAMPLE STRUCTURE (adapt creatively, don't copy literally):
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">
<style>
  .gc-hero { ... }
  .gc-hero__inner { ... }
  .gc-hero__headline { ... }
  .gc-hero__sub { ... }
  .gc-hero__btn { ... }
  /* decorative elements */
  .gc-hero__deco { ... }
  .gc-hero__deco::before { ... }
</style>
<div class="gc-hero">
  <div class="gc-hero__inner">
    <div class="gc-hero__deco"></div>
    <h2 class="gc-hero__headline">...</h2>
    <p class="gc-hero__sub">...</p>
    <a href="#products" class="gc-hero__btn">Shop Gift Cards</a>
  </div>
</div>`;
}
