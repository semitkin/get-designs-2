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

export const heroDesignJsonSchema = {
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
    taglines: {
      type: "array",
      items: { type: "string" },
    },
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
    dominantColors: {
      type: "array",
      items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    },
  },
};

export function validateHeroDesign(data: unknown): data is HeroDesign {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  // logo
  if (typeof obj.logo !== "object" || obj.logo === null) return false;
  const logo = obj.logo as Record<string, unknown>;
  if (typeof logo.description !== "string") return false;
  if (!Array.isArray(logo.colors)) return false;

  // hero
  if (typeof obj.hero !== "object" || obj.hero === null) return false;
  const hero = obj.hero as Record<string, unknown>;
  const heroStringFields = ["headline", "subheadline", "ctaText", "ctaColor", "backgroundColor", "layout", "imageDescription"];
  for (const f of heroStringFields) {
    if (typeof hero[f] !== "string") return false;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(hero.ctaColor as string)) return false;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hero.backgroundColor as string)) return false;

  // taglines
  if (!Array.isArray(obj.taglines)) return false;

  // typography
  if (typeof obj.typography !== "object" || obj.typography === null) return false;
  const typo = obj.typography as Record<string, unknown>;
  if (typeof typo.primaryFont !== "string") return false;
  if (typeof typo.headingStyle !== "string") return false;

  // visualStyle
  if (typeof obj.visualStyle !== "string") return false;

  // dominantColors
  if (!Array.isArray(obj.dominantColors)) return false;
  for (const c of obj.dominantColors) {
    if (typeof c !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(c)) return false;
  }

  return true;
}
