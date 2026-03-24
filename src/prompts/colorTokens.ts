import { designTokensJsonSchema } from "@/lib/schema";

export function buildPrompt(url: string): string {
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
