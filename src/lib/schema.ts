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

export const designTokensJsonSchema = {
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
        value: {
          type: "string",
          description: "Hex color value, e.g. #0057FF",
          pattern: "^#[0-9A-Fa-f]{6}$",
        },
        label: {
          type: "string",
          description: "Human-readable color name, e.g. Electric Blue",
        },
      },
    },
  },
};

const TOKEN_KEYS: Array<keyof DesignTokens> = [
  "primary", "secondary", "success", "error", "warning", "info", "neutral",
];

export function validateDesignTokens(data: unknown): data is DesignTokens {
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
