import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import {
  ensureFieldKeys,
  slugifyFieldKey,
  validateBlockFields,
} from "../../lib/block-fields";
import type { BlockField } from "../../lib/blocks.server";
import "../../styles/block-form.css";

// Supported control types (Attribute Builder). Kept in sync with the
// gutenberg-block-kit schema-driven factory (blockFactory.jsx CONTROL_ATTR).
const CONTROL_TYPES = [
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
] as const;

type Control = (typeof CONTROL_TYPES)[number];

// Plain-language names for the field-type dropdown so non-developers don't
// have to know the internal control keys.
const CONTROL_LABELS: Record<Control, string> = {
  text: "Text (short)",
  textarea: "Text (paragraph)",
  richtext: "Rich text (bold, links)",
  number: "Number",
  boolean: "Yes / No toggle",
  select: "Dropdown (pick one)",
  multiselect: "Dropdown (pick many)",
  color: "Color picker",
  image: "Image",
  video: "Video",
  url: "Link (URL)",
  action: "Button action",
  collection: "Collection picker",
  product: "Product picker",
  page: "Page picker",
  repeater: "Repeater",
  group: "Group",
};

// UI export keys (screenshot / copy-paste format). Internal save still uses control + itemFields.
const CONTROL_TO_UI_TYPE: Record<Control, string> = {
  text: "text-short",
  textarea: "text-long",
  richtext: "richtext",
  number: "number",
  boolean: "toggle",
  select: "select",
  multiselect: "multiselect",
  color: "color-picker",
  image: "image",
  video: "video",
  url: "url",
  action: "action",
  collection: "collection",
  product: "product",
  page: "page",
  repeater: "repeater",
  group: "group",
};

// "Hero Title" → "heroTitle" — auto key so non-devs only type a label.
function slugifyKey(label: string): string {
  return slugifyFieldKey(label);
}

export type EditorField = {
  key: string;
  control: Control;
  label?: string;
  panel?: string;
  default?: unknown;
  optionsText?: string; // UI-only: comma-separated → options[]
  rows?: number;
  itemFields?: EditorField[];
  fields?: EditorField[];
  _keyTouched?: boolean; // UI-only: true once user hand-edits the key
};

export type BlockCategoryOption = { slug: string; title: string };

export type BlockFormValue = {
  id?: string;
  name: string;
  title: string;
  description: string;
  categorySlug: string;
  icon: string;
  previewImage: string;
  keywords: string; // comma-separated in the UI
  isContainer: boolean; // block accepts child blocks (InnerBlocks)
  allowedChildren: string[]; // allowed child block names ([] = allow any)
  supportWide: boolean;
  supportHtml: boolean;
  fields: EditorField[];
};

const NEEDS_OPTIONS: Control[] = ["select", "multiselect"];
const HAS_CHILDREN: Control[] = ["repeater", "group"];

// Legacy / alternate keys accepted on import (mapped to gutenberg-block-kit controls).
const CONTROL_ALIASES: Record<string, Control> = {
  "text-short": "text",
  "text-long": "textarea",
  toggle: "boolean",
  "color-picker": "color",
  "image-picker": "image",
  "video-picker": "video",
};

function blankField(): EditorField {
  return { key: "", control: "text", label: "", panel: "Content" };
}

function blankChildField(siblings: EditorField[]): EditorField {
  let n = siblings.length + 1;
  let key = `field${n}`;
  const used = new Set(siblings.map((f) => f.key).filter(Boolean));
  while (used.has(key)) {
    n += 1;
    key = `field${n}`;
  }
  return { key, control: "text", label: "", panel: "Content", _keyTouched: true };
}

function editorToBlockFields(fields: EditorField[]): BlockField[] {
  return ensureFieldKeys(
    fields.map((f) => {
      const out: BlockField = {
        key: f.key.trim(),
        control: f.control,
        label: f.label,
        panel: f.panel,
      };
      if (f.default !== undefined && f.default !== "") out.default = f.default;
      if (NEEDS_OPTIONS.includes(f.control)) {
        out.options = textToOptions(f.optionsText || "");
      }
      if (f.control === "repeater") {
        out.itemFields = editorToBlockFields(f.itemFields || []);
      }
      if (f.control === "group") {
        out.fields = editorToBlockFields(f.fields || []);
      }
      return out;
    }),
  );
}

function resolveControl(raw: unknown): Control {
  if (typeof raw === "string" && (CONTROL_TYPES as readonly string[]).includes(raw)) {
    return raw as Control;
  }
  if (typeof raw === "string" && CONTROL_ALIASES[raw]) return CONTROL_ALIASES[raw];
  return "text";
}

/** Read field definitions from any supported block/API shape. */
function extractSchemaFields(block: any): any[] {
  if (Array.isArray(block?.fields) && block.fields.length) return block.fields;
  if (Array.isArray(block?.schema?.fields)) return block.schema.fields;
  // Legacy export shape: `attributes: [{ key, type, children }]`
  if (Array.isArray(block?.schema?.attributes)) return block.schema.attributes;
  if (
    Array.isArray(block?.attributes) &&
    block.attributes.some((f: any) => f && (f.control || f.type))
  ) {
    return block.attributes;
  }
  return [];
}

// ── options serialization ─────────────────────────────────────────────────────
function optionsToText(options: unknown): string {
  if (!Array.isArray(options)) return "";
  return options
    .map((o) => (typeof o === "string" ? o : o?.label ?? o?.value ?? ""))
    .join(", ");
}
function textToOptions(text: string) {
  return (text || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ label: t, value: t }));
}

// ── DB ⇆ editor mapping ───────────────────────────────────────────────────────
function fieldFromSchema(f: any): EditorField {
  const control = resolveControl(f.control ?? f.type);
  const nested =
    control === "repeater"
      ? f.itemFields ?? f.children
      : control === "group"
        ? f.fields ?? f.children
        : undefined;

  return {
    key: f.key ?? "",
    _keyTouched: Boolean(f.key), // preserve an existing key while editing its label
    control,
    label: f.label ?? "",
    panel: f.panel ?? "Content",
    default: f.default,
    optionsText: optionsToText(f.options),
    rows: f.rows,
    itemFields:
      control === "repeater" && Array.isArray(nested) ? nested.map(fieldFromSchema) : undefined,
    fields: control === "group" && Array.isArray(nested) ? nested.map(fieldFromSchema) : undefined,
  };
}

export function toFormValue(block: any | null, defaultCategory: string): BlockFormValue {
  if (!block) {
    return {
      name: "",
      title: "",
      description: "",
      categorySlug: defaultCategory,
      icon: "smiley",
      previewImage: "",
      keywords: "",
      isContainer: false,
      allowedChildren: [],
      supportWide: true,
      supportHtml: false,
      fields: [],
    };
  }
  const supports = block.supports || {};
  const schema = block.schema || {};
  return {
    id: block.id,
    name: block.name,
    title: block.title,
    description: block.description || "",
    categorySlug: block.categorySlug || defaultCategory,
    icon: block.icon || "smiley",
    previewImage: block.previewImage || "",
    keywords: (block.keywords || []).join(", "),
    isContainer: Array.isArray(schema.allowedBlocks),
    allowedChildren: Array.isArray(schema.allowedBlocks) ? schema.allowedBlocks : [],
    supportWide:
      supports.wideAlign ??
      (Array.isArray(supports.align) ? supports.align.includes("wide") : true),
    supportHtml: supports.rawHtml ?? supports.html === true,
    fields: extractSchemaFields(block).map(fieldFromSchema),
  };
}

function toPayload(v: BlockFormValue) {
  const fields = editorToBlockFields(v.fields);
  const schema: Record<string, unknown> = {
    attributes: {},
    fields,
  };
  if (v.isContainer) schema.allowedBlocks = v.allowedChildren;

  return {
    name: v.name,
    title: v.title,
    description: v.description,
    categorySlug: v.categorySlug,
    icon: v.icon,
    previewImage: v.previewImage || null,
    keywords: v.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    supports: {
      html: v.supportHtml,
      align: v.supportWide ? ["wide", "full"] : [],
    },
    schema,
  };
}

function blockFieldToUiAttribute(f: BlockField): Record<string, unknown> {
  const control = f.control as Control;
  const out: Record<string, unknown> = {
    key: f.key,
    label: f.label || "",
    type: CONTROL_TO_UI_TYPE[control] ?? f.control,
  };
  if (f.default !== undefined && f.default !== "") out.default = f.default;
  if (f.control === "repeater") {
    out.children = (f.itemFields || []).map(blockFieldToUiAttribute);
  }
  if (f.control === "group") {
    out.children = (f.fields || []).map(blockFieldToUiAttribute);
  }
  return out;
}

/** Screenshot-style JSON shown in the export panel. */
export function toUiExport(v: BlockFormValue) {
  const fields = editorToBlockFields(v.fields);
  return {
    name: v.name,
    title: v.title,
    description: v.description,
    categorySlug: v.categorySlug,
    icon: v.icon,
    keywords: v.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    supports: {
      wideAlign: v.supportWide,
      rawHtml: v.supportHtml,
    },
    attributes: fields.map(blockFieldToUiAttribute),
  };
}

// ── lightweight form primitives (no Polaris) ────────────────────────────────
function Btn({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`bf-btn bf-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="bf-field">
      <label className="bf-label">{label}</label>
      {children}
      {hint ? <span className="bf-hint">{hint}</span> : null}
    </div>
  );
}

// ── recursive field row editor ──────────────────────────────────────────────
function FieldRow({
  field,
  onChange,
  onRemove,
  onMove,
  depth,
  open,
  onToggle,
}: {
  field: EditorField;
  onChange: (next: EditorField) => void;
  onRemove: () => void;
  onMove: (dir: number) => void;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  const set = (patch: Partial<EditorField>) => onChange({ ...field, ...patch });
  const children = field.control === "repeater" ? field.itemFields : field.fields;
  const childKey = field.control === "repeater" ? "itemFields" : "fields";

  const setChildren = (next: EditorField[]) => set({ [childKey]: next } as Partial<EditorField>);

  const setControl = (control: Control) => {
    const patch: Partial<EditorField> = { control };
    if (!HAS_CHILDREN.includes(control)) {
      patch.itemFields = undefined;
      patch.fields = undefined;
    } else if (control === "repeater") {
      patch.fields = undefined;
      patch.itemFields = field.itemFields?.length ? field.itemFields : [blankChildField([])];
    } else {
      patch.itemFields = undefined;
      patch.fields = field.fields?.length ? field.fields : [blankChildField([])];
    }
    set(patch);
  };

  return (
    <div className={`bf-field-row${open ? "" : " is-collapsed"}`}>
      <div
        className="bf-field-row__head bf-field-row__head--toggle"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className={`bf-field-row__chevron${open ? " is-open" : ""}`} aria-hidden>
          ▶
        </span>
        <span title="Drag to reorder" className="bf-field-row__grip" onClick={(e) => e.stopPropagation()}>
          ⠿
        </span>
        <span className="bf-field-row__name">
          {field.label || field.key || "New field"}
        </span>
        <span className="bf-pill">{CONTROL_LABELS[field.control]}</span>
        {field.key ? <span className="bf-field-row__key">{field.key}</span> : null}
        <div className="bf-field-row__actions" onClick={(e) => e.stopPropagation()}>
          <Btn variant="ghost" onClick={() => onMove(-1)}>↑</Btn>
          <Btn variant="ghost" onClick={() => onMove(1)}>↓</Btn>
          <Btn variant="danger" onClick={onRemove}>🗑</Btn>
        </div>
      </div>

      {open ? (
      <div className="bf-field-row__body">
      <div className="bf-stack bf-stack--sm">
        <div className="bf-grid-2">
          <Field label="Field label">
            <input
              className="bf-input"
              value={field.label || ""}
              placeholder="e.g. Title"
              onChange={(e) => {
                const label = e.target.value;
                const patch: Partial<EditorField> = { label };
                if (!field._keyTouched) patch.key = slugifyKey(label);
                set(patch);
              }}
            />
          </Field>
          <Field label="Field type">
            <select
              className="bf-select"
              value={field.control}
              onChange={(e) => setControl(e.target.value as Control)}
            >
              {CONTROL_TYPES.map((c) => (
                <option key={c} value={c}>
                  {CONTROL_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="bf-grid-2">
          {!HAS_CHILDREN.includes(field.control) ? (
            <Field label="Default value">
              <input
                className="bf-input"
                value={field.default == null ? "" : String(field.default)}
                onChange={(e) => set({ default: e.target.value })}
              />
            </Field>
          ) : (
            <Field label="Default value">
              <input className="bf-input" value="" readOnly disabled />
            </Field>
          )}
          <Field label="Key (auto from label)">
            <input
              className="bf-input"
              value={field.key}
              placeholder="field-key"
              onChange={(e) => set({ key: e.target.value, _keyTouched: true })}
            />
          </Field>
        </div>

        {NEEDS_OPTIONS.includes(field.control) ? (
          <Field label="Options (comma-separated)">
            <input
              className="bf-input"
              value={field.optionsText || ""}
              placeholder="Left, Center, Right"
              onChange={(e) => set({ optionsText: e.target.value })}
            />
          </Field>
        ) : null}

        {HAS_CHILDREN.includes(field.control) && depth < 1 ? (
          <div className="bf-children">
            <span className="bf-children__label">CHILD FIELDS</span>
            <FieldList fields={children || []} onChange={setChildren} depth={depth + 1} />
            <Btn
              variant="ghost"
              onClick={() => setChildren([...(children || []), blankChildField(children || [])])}
            >
              + Add child field
            </Btn>
          </div>
        ) : null}
      </div>
      </div>
      ) : null}
    </div>
  );
}

// Drag-and-drop reorderable list of fields (used at top level and for
// repeater/group children). Native HTML5 DnD — no extra dependency.
function FieldList({
  fields,
  onChange,
  depth,
}: {
  fields: EditorField[];
  onChange: (next: EditorField[]) => void;
  depth: number;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  // New / empty fields start open; saved fields start collapsed.
  const [openMap, setOpenMap] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(fields.map((f, i) => [i, !(f.key || f.label)])),
  );

  const setOpen = (index: number, next: boolean) => {
    setOpenMap((m) => ({ ...m, [index]: next }));
  };

  const toggleOpen = (index: number) => {
    setOpenMap((m) => ({ ...m, [index]: !m[index] }));
  };

  const expandAll = () => {
    setOpenMap(Object.fromEntries(fields.map((_, i) => [i, true])));
  };

  const collapseAll = () => {
    setOpenMap(Object.fromEntries(fields.map((_, i) => [i, false])));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return;
    const arr = fields.slice();
    const [it] = arr.splice(from, 1);
    arr.splice(to, 0, it);
    onChange(arr);
    setOpenMap((m) => {
      const states = fields.map((f, i) => m[i] ?? !(f.key || f.label));
      const [moved] = states.splice(from, 1);
      states.splice(to, 0, moved);
      return Object.fromEntries(states.map((v, i) => [i, v]));
    });
  };

  useEffect(() => {
    setOpenMap((m) => {
      const next: Record<number, boolean> = {};
      fields.forEach((f, i) => {
        next[i] = m[i] ?? !(f.key || f.label);
      });
      return next;
    });
  }, [fields.length]);

  const handleChange = (index: number, next: EditorField) => {
    onChange(fields.map((c, j) => (j === index ? next : c)));
    // Auto-expand when user starts typing a new field label.
    if (!(fields[index].key || fields[index].label) && (next.key || next.label)) {
      setOpen(index, true);
    }
  };

  const handleRemove = (index: number) => {
    onChange(fields.filter((_, j) => j !== index));
    setOpenMap((m) => {
      const states = fields.map((f, i) => m[i] ?? !(f.key || f.label));
      states.splice(index, 1);
      return Object.fromEntries(states.map((v, i) => [i, v]));
    });
  };

  return (
    <div className="bf-field-list">
      {depth === 0 && fields.length > 1 ? (
        <div className="bf-field-list__toolbar">
          <button type="button" className="bf-link-btn" onClick={expandAll}>
            Expand all
          </button>
          <span className="bf-field-list__sep">·</span>
          <button type="button" className="bf-link-btn" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
      ) : null}
      {fields.map((f, i) => (
        <div
          key={i}
          className={`bf-dnd-item${dragIdx === i ? " is-dragging" : ""}${overIdx === i && dragIdx !== null && dragIdx !== i ? " is-over" : ""}`}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => {
            e.preventDefault();
            if (overIdx !== i) setOverIdx(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIdx !== null) move(dragIdx, i);
            setDragIdx(null);
            setOverIdx(null);
          }}
          onDragEnd={() => {
            setDragIdx(null);
            setOverIdx(null);
          }}
        >
          <FieldRow
            field={f}
            depth={depth}
            open={openMap[i] ?? !(f.key || f.label)}
            onToggle={() => toggleOpen(i)}
            onChange={(next) => handleChange(i, next)}
            onRemove={() => handleRemove(i)}
            onMove={(dir) => move(i, i + dir)}
          />
        </div>
      ))}
    </div>
  );
}

export function BlockForm({
  initial,
  categories,
}: {
  initial: BlockFormValue;
  categories: BlockCategoryOption[];
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState<BlockFormValue>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  // Once the user edits the namespace by hand (or on an existing block) we stop
  // auto-deriving it from the block name.
  const [nameTouched, setNameTouched] = useState(Boolean(initial.id));
  const isEdit = Boolean(value.id);

  const set = (patch: Partial<BlockFormValue>) => setValue((v) => ({ ...v, ...patch }));

  const exportJson = useMemo(() => JSON.stringify(toUiExport(value), null, 2), [value]);

  async function save(nextStatus?: "draft" | "enabled") {
    setSaving(true);
    setError(null);
    try {
      const fieldError = validateBlockFields(editorToBlockFields(value.fields));
      if (fieldError) throw new Error(fieldError);

      const payload: Record<string, unknown> = { ...toPayload(value) };
      if (nextStatus) payload.status = nextStatus;
      const res = isEdit
        ? await fetch(`/api/cms/blocks/${value.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/cms/blocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      navigate(`/app/blocks/${data.block.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function applyImport() {
    try {
      const parsed = JSON.parse(importText);
      setValue(toFormValue(
        {
          ...parsed,
          categorySlug: parsed.categorySlug ?? parsed.category,
          supports: parsed.supports,
          schema: parsed.schema || {
            fields: parsed.fields || parsed.attributes || [],
            parent: parsed.parent,
            allowedBlocks: parsed.allowedBlocks,
          },
          fields: parsed.fields || parsed.attributes,
          keywords: parsed.keywords || [],
        },
        value.categorySlug,
      ));
      setImportText("");
    } catch {
      setError("Invalid JSON.");
    }
  }

  return (
    <div className="bf-page">
      <header className="bf-header">
        <h1 className="bf-header__title">
          {isEdit ? `Edit ${value.title || "block"}` : "Create block"}
        </h1>
        <div className="bf-header__actions">
          <Btn variant="secondary" onClick={() => save("enabled")} disabled={saving}>
            Save &amp; enable
          </Btn>
          <Btn variant="primary" onClick={() => save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Btn>
        </div>
      </header>

      {error ? <div className="bf-banner">{error}</div> : null}

      <div className="bf-shell">
        <div className="bf-two-col">
          <div className="bf-card">
            <h2 className="bf-card__title">Details</h2>
            <div className="bf-stack">
              <Field label="Block name">
                <input
                  className="bf-input"
                  value={value.title}
                  placeholder="Hero Banner"
                  onChange={(e) => {
                    const title = e.target.value;
                    const patch: Partial<BlockFormValue> = { title };
                    if (!nameTouched) {
                      patch.name = `cms/${slugifyKey(title).replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "")}`;
                    }
                    set(patch);
                  }}
                />
              </Field>
              <Field
                label="Namespace (block ID)"
                hint="Auto-filled from the name. Unique per store."
              >
                <input
                  className="bf-input"
                  value={value.name}
                  placeholder="cms/hero-banner"
                  onChange={(e) => {
                    setNameTouched(true);
                    set({ name: e.target.value });
                  }}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className="bf-textarea"
                  value={value.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>
              <div className="bf-grid-2">
                <Field label="Category">
                  <select
                    className="bf-select"
                    value={value.categorySlug}
                    onChange={(e) => set({ categorySlug: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Icon">
                  <input
                    className="bf-input"
                    value={value.icon}
                    placeholder="cover-image"
                    onChange={(e) => set({ icon: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Keywords (comma-separated)">
                <input
                  className="bf-input"
                  value={value.keywords}
                  onChange={(e) => set({ keywords: e.target.value })}
                />
              </Field>
              <div className="bf-check-row">
                <label className="bf-check">
                  <input
                    type="checkbox"
                    checked={value.supportWide}
                    onChange={(e) => set({ supportWide: e.target.checked })}
                  />
                  Support wide / Full align
                </label>
                <label className="bf-check">
                  <input
                    type="checkbox"
                    checked={value.supportHtml}
                    onChange={(e) => set({ supportHtml: e.target.checked })}
                  />
                  Allow raw HTML editing
                </label>
              </div>
            </div>
          </div>

          <div className="bf-card">
            <div className="bf-card__head">
              <h2 className="bf-card__title">Attributes</h2>
              <span className="bf-card__spacer" />
              <Btn variant="primary" onClick={() => set({ fields: [...value.fields, blankField()] })}>
                + Add
              </Btn>
            </div>
            {value.fields.length === 0 ? (
              <p className="bf-empty">
                No attributes yet. Click “+ Add” to create one — use Repeater for child fields.
              </p>
            ) : (
              <FieldList
                fields={value.fields}
                onChange={(f) => set({ fields: f })}
                depth={0}
              />
            )}
          </div>
        </div>

        <div className="bf-json bf-card">
          <h2 className="bf-card__title">Block JSON</h2>
          <pre className="bf-json-pre">{exportJson}</pre>
          <details className="bf-import">
            <summary>Import JSON</summary>
            <div className="bf-stack" style={{ marginTop: 12 }}>
              <Field label="Paste JSON to import">
                <textarea
                  className="bf-textarea"
                  value={importText}
                  rows={6}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </Field>
              <Btn variant="secondary" onClick={applyImport}>
                Import JSON
              </Btn>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
