/* ═══════════════════════════════════════════════════════════════
   Wave AI — Input Validation Layer
   Schema-based validation for all inputs entering the system.
═══════════════════════════════════════════════════════════════ */

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: unknown;
}

/* ── Generic validator ───────────────────────────────────────── */
export function validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const rule of rules) {
    if (!rule.validate(value)) errors.push(rule.message);
  }
  return { valid: errors.length === 0, errors, warnings, sanitized: value };
}

/* ── Common rules ────────────────────────────────────────────── */
export const rules = {
  required: <T>(message = "Field is required"): ValidationRule<T> => ({
    validate: (v) => v !== null && v !== undefined && v !== "",
    message,
  }),
  minLength: (min: number): ValidationRule<string> => ({
    validate: (v) => typeof v === "string" && v.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (max: number): ValidationRule<string> => ({
    validate: (v) => typeof v === "string" && v.length <= max,
    message: `Must be at most ${max} characters`,
  }),
  isEmail: (): ValidationRule<string> => ({
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: "Must be a valid email address",
  }),
  isUrl: (): ValidationRule<string> => ({
    validate: (v) => { try { new URL(v); return true; } catch { return false; } },
    message: "Must be a valid URL",
  }),
  noScript: (): ValidationRule<string> => ({
    validate: (v) => !/<script\b[^>]*>([\s\S]*?)<\/script>/gi.test(v),
    message: "Input cannot contain script tags",
  }),
  maxTokens: (max: number): ValidationRule<string> => ({
    validate: (v) => v.split(/\s+/).length <= max * 1.5,
    message: `Input exceeds maximum length`,
  }),
};

/* ── Chat message validator ──────────────────────────────────── */
export function validateChatMessage(message: string): ValidationResult {
  return validate(message, [
    rules.required("Message cannot be empty"),
    rules.minLength(1),
    rules.maxLength(10000),
    rules.noScript(),
  ]);
}

/* ── API key validator ───────────────────────────────────────── */
export function validateApiKey(key: string): ValidationResult {
  const errors: string[] = [];
  if (!key) errors.push("API key is required");
  if (key && key.length < 10) errors.push("API key appears too short");
  if (key && !/^hf_/.test(key) && key.length > 0) errors.push("HuggingFace API keys should start with 'hf_'");
  return { valid: errors.length === 0, errors, warnings: [], sanitized: key.trim() };
}

/* ── Document validator ──────────────────────────────────────── */
export function validateDocument(doc: unknown): ValidationResult {
  const errors: string[] = [];
  const d = doc as Record<string, unknown>;
  if (!d?.content || typeof d.content !== "string") errors.push("Document must have string content");
  if (d?.content && (d.content as string).length > 500000) errors.push("Document too large (max 500KB)");
  if (!d?.title) errors.push("Document must have a title");
  return { valid: errors.length === 0, errors, warnings: [], sanitized: doc };
}

/* ── Sanitize user input ─────────────────────────────────────── */
export function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim()
    .slice(0, 10000);
}
