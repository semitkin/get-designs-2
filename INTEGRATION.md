# Integration Guide — getDesign library

This guide explains how to integrate `getDesign.ts` into any TypeScript web app.

## What you get

Three async functions that call GPT-4o to extract brand design data from any public website:

| Function | Input | Output |
|---|---|---|
| `extractColorTokens(url, apiKey)` | website URL | 7 semantic color tokens (primary, secondary, success, error, warning, info, neutral) |
| `extractHeroDesign(url, apiKey)` | website URL | hero section data: headline, CTA, colors, typography, visual style |
| `generateBannerHtml(heroDesign, apiKey, tokens?)` | extracted hero data + optional tokens | self-contained HTML+CSS gift card banner |

---

## Step 1 — Install the dependency

```bash
npm install openai
```

That's the only dependency. No other packages required.

---

## Step 2 — Copy the library file

Copy [`src/lib/getDesign.ts`](src/lib/getDesign.ts) into your project, e.g.:

```
your-app/
  src/
    lib/
      getDesign.ts   ← paste here
```

---

## Step 3 — Use it

### Extract color tokens

```typescript
import { extractColorTokens } from "./lib/getDesign";

const tokens = await extractColorTokens(
  "https://example.com",
  process.env.OPENAI_API_KEY!
);

console.log(tokens.primary);   // { value: "#0057FF", label: "Electric Blue" }
console.log(tokens.secondary); // { value: "#FF6B00", label: "Warm Orange" }
```

### Extract hero design

```typescript
import { extractHeroDesign } from "./lib/getDesign";

const hero = await extractHeroDesign(
  "https://example.com",
  process.env.OPENAI_API_KEY!
);

console.log(hero.hero.headline);   // "Shop Everything You Love"
console.log(hero.hero.ctaColor);   // "#FF6B00"
console.log(hero.taglines);        // ["Free shipping on orders over $50"]
```

### Generate a banner HTML snippet

```typescript
import { generateBannerHtml } from "./lib/getDesign";

const html = await generateBannerHtml(
  hero,                          // HeroDesign from extractHeroDesign()
  process.env.OPENAI_API_KEY!,
  tokens                         // optional DesignTokens — improves color fidelity
);

// html is a self-contained <style>...<div class="gc-hero">...</div> string
document.getElementById("banner-slot")!.innerHTML = html;
```

---

## Full pipeline example

```typescript
import {
  extractColorTokens,
  extractHeroDesign,
  generateBannerHtml,
} from "./lib/getDesign";

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const BRAND_URL = "https://example.com";

// Run color and hero extraction in parallel
const [tokens, hero] = await Promise.all([
  extractColorTokens(BRAND_URL, OPENAI_KEY),
  extractHeroDesign(BRAND_URL, OPENAI_KEY),
]);

// Generate the banner using both
const bannerHtml = await generateBannerHtml(hero, OPENAI_KEY, tokens);

console.log(bannerHtml); // paste into your page or inject via innerHTML
```

---

## API key

The functions accept the OpenAI API key as a plain argument. How you supply it depends on your setup:

- **Node.js / Next.js / server**: `process.env.OPENAI_API_KEY`
- **Other runtimes**: read from your environment or secrets manager and pass as a string

Never expose the key on the client side.

---

## Error handling

All three functions throw a plain `Error` with a descriptive message if:
- The OpenAI call fails (network error, invalid key, quota exceeded)
- The model returns malformed JSON
- The model response does not match the expected schema

Wrap calls in `try/catch`:

```typescript
try {
  const tokens = await extractColorTokens(url, apiKey);
} catch (err) {
  console.error("Design extraction failed:", err.message);
}
```

---

## TypeScript types

All types are exported from `getDesign.ts`:

```typescript
import type { ColorToken, DesignTokens, HeroDesign } from "./lib/getDesign";
```
