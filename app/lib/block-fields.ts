import type { BlockField } from "./blocks.server";

const VALID_CONTROLS = new Set([
  "text",
  "textarea",
  "richtext",
  "number",
  "boolean",
  "select",
  "multiselect",
  "color",
  "image",
  "video",
  "url",
  "action",
  "collection",
  "product",
  "page",
  "repeater",
  "group",
]);

const CONTROL_ALIASES: Record<string, string> = {
  "text-short": "text",
  "text-long": "textarea",
  toggle: "boolean",
  "color-picker": "color",
  "image-picker": "image",
  "video-picker": "video",
};

/** "Hero Title" → "heroTitle" */
export function slugifyFieldKey(label: string): string {
  const parts = (label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (parts.length === 0) return "";
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

export function resolveControl(raw: unknown): string {
  if (typeof raw === "string" && VALID_CONTROLS.has(raw)) return raw;
  if (typeof raw === "string" && CONTROL_ALIASES[raw]) return CONTROL_ALIASES[raw];
  return "text";
}

function nestedRaw(field: Record<string, unknown>, control: string): unknown[] {
  if (control === "repeater") return (field.itemFields ?? field.children ?? []) as unknown[];
  if (control === "group") return (field.fields ?? field.children ?? []) as unknown[];
  return [];
}

/** Normalize one field from DB/UI (type→control, children→itemFields). */
export function normalizeBlockField(raw: Record<string, unknown>): BlockField {
  const control = resolveControl(raw.control ?? raw.type);
  const nested = nestedRaw(raw, control).map((f) =>
    normalizeBlockField(f as Record<string, unknown>),
  );

  const out: BlockField = {
    key: String(raw.key ?? "").trim(),
    control,
  };
  if (raw.label) out.label = String(raw.label);
  if (raw.panel) out.panel = String(raw.panel);
  if (raw.default !== undefined && raw.default !== "") out.default = raw.default;
  if (Array.isArray(raw.options)) out.options = raw.options as BlockField["options"];
  if (typeof raw.rows === "number") out.rows = raw.rows;
  if (control === "repeater" && nested.length) out.itemFields = nested;
  if (control === "group" && nested.length) out.fields = nested;
  return out;
}

/** Assign unique non-empty keys so gutenberg-block-kit repeaters don't crash. */
export function ensureFieldKeys(fields: BlockField[], prefix = "field"): BlockField[] {
  const used = new Set<string>();

  const uniqueKey = (base: string, index: number) => {
    let key = base.trim() || `${prefix}${index + 1}`;
    let n = 2;
    while (used.has(key)) {
      key = `${base.trim() || prefix}${n++}`;
    }
    used.add(key);
    return key;
  };

  return fields.map((field, index) => {
    const base = field.key.trim() || slugifyFieldKey(field.label ?? "") || `${prefix}${index + 1}`;
    const key = uniqueKey(base, index);
    const next: BlockField = { ...field, key };

    if (field.control === "repeater" && field.itemFields?.length) {
      next.itemFields = ensureFieldKeys(field.itemFields, "item");
    }
    if (field.control === "group" && field.fields?.length) {
      next.fields = ensureFieldKeys(field.fields, "sub");
    }
    return next;
  });
}

export function normalizeBlockFields(raw: unknown): BlockField[] {
  if (!Array.isArray(raw)) return [];
  return ensureFieldKeys(
    raw.map((f) => normalizeBlockField((f ?? {}) as Record<string, unknown>)),
  );
}

/** Repeater fields must have at least one child with a key before enabling. */
export function validateBlockFields(fields: BlockField[]): string | null {
  for (const field of fields) {
    if (!field.key.trim()) return "Every attribute needs a key.";
    if (field.control === "repeater") {
      if (!field.itemFields?.length) {
        return `Repeater "${field.label || field.key}" needs at least one child field.`;
      }
      const childError = validateBlockFields(field.itemFields);
      if (childError) return childError;
    }
    if (field.control === "group" && field.fields?.length) {
      const childError = validateBlockFields(field.fields);
      if (childError) return childError;
    }
  }
  return null;
}
