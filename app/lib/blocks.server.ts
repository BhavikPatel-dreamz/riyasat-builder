import db from "../db.server";
import { normalizeBlockFields } from "./block-fields";

export type BlockStatus = "draft" | "enabled" | "disabled";

/** A single control in the Attribute Builder. */
export type BlockField = {
  key: string;
  control: string; // text | textarea | richtext | number | boolean | select | ...
  label?: string;
  panel?: string;
  default?: unknown;
  options?: Array<{ label: string; value: string } | string>;
  rows?: number;
  itemFields?: BlockField[]; // repeater
  fields?: BlockField[]; // group
};

/** The pure-JSON authoring payload stored in BlockDefinition.schema. */
export type BlockSchema = {
  attributes?: Record<string, { type: string; default?: unknown }>;
  fields?: BlockField[];
  // Restrict this block to only be insertable inside these parent blocks
  // (gutenberg-block-kit passes this straight to Gutenberg's `parent`).
  parent?: string[];
  // Make this block a container that accepts child blocks (InnerBlocks).
  // Present (even empty) → container. Empty = allow any block; non-empty =
  // restrict to these child block names.
  allowedBlocks?: string[];
};

export type BlockInput = {
  name: string;
  title: string;
  description?: string | null;
  categorySlug?: string;
  icon?: string;
  previewImage?: string | null;
  keywords?: string[];
  supports?: Record<string, unknown>;
  schema?: BlockSchema;
  status?: BlockStatus;
};

/** Row shape returned to the admin list. */
export type BlockListItem = {
  id: string;
  name: string;
  title: string;
  categorySlug: string;
  previewImage: string | null;
  status: string;
  version: number;
  updatedAt: string;
};

/** Registry entry consumed by gutenberg-block-kit `buildBlockSettings`. */
export type BlockRegistryEntry = {
  name: string;
  title: string;
  description: string;
  category: string;
  categoryTitle?: string;
  icon: string;
  previewImage: string | null;
  keywords: string[];
  supports: Record<string, unknown>;
  attributes: Record<string, unknown>;
  fields: BlockField[];
  parent?: string[];
  allowedBlocks?: string[];
};

const DEFAULT_CATEGORIES: Array<{ slug: string; title: string; sortOrder: number }> = [
  { slug: "layout", title: "Layout", sortOrder: 0 },
  { slug: "marketing", title: "Marketing", sortOrder: 1 },
  { slug: "products", title: "Products", sortOrder: 2 },
  { slug: "collections", title: "Collections", sortOrder: 3 },
  { slug: "media", title: "Media", sortOrder: 4 },
  { slug: "content", title: "Content", sortOrder: 5 },
  { slug: "forms", title: "Forms", sortOrder: 6 },
  { slug: "custom", title: "Custom", sortOrder: 7 },
];

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeName(name: string): string {
  const trimmed = (name || "").trim().toLowerCase();
  if (!trimmed.includes("/")) return `cms/${trimmed.replace(/[^a-z0-9-]/g, "-")}`;
  const [ns, ...rest] = trimmed.split("/");
  const slug = rest.join("-").replace(/[^a-z0-9-]/g, "-");
  return `${ns.replace(/[^a-z0-9-]/g, "-")}/${slug}`;
}

// ── categories ──────────────────────────────────────────────────────────────
export async function listCategories(shop: string) {
  const rows = await db.blockCategory.findMany({
    where: { shop },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
  if (rows.length === 0) {
    await db.blockCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, shop })),
      skipDuplicates: true,
    });
    return db.blockCategory.findMany({
      where: { shop },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
  }
  return rows;
}

export async function createCategory(shop: string, input: { slug: string; title: string; sortOrder?: number }) {
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return db.blockCategory.upsert({
    where: { shop_slug: { shop, slug } },
    update: { title: input.title, sortOrder: input.sortOrder ?? 0 },
    create: { shop, slug, title: input.title, sortOrder: input.sortOrder ?? 99 },
  });
}

// ── list / get ────────────────────────────────────────────────────────────────
export async function listBlocks(
  shop: string,
  opts: { search?: string; category?: string; status?: string } = {},
): Promise<BlockListItem[]> {
  const where: Record<string, unknown> = { shop };
  if (opts.category) where.categorySlug = opts.category;
  if (opts.status) where.status = opts.status;
  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { name: { contains: opts.search, mode: "insensitive" } },
    ];
  }
  const rows = await db.blockDefinition.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, name: true, title: true, categorySlug: true,
      previewImage: true, status: true, version: true, updatedAt: true,
    },
  });
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
}

export async function getBlock(shop: string, id: string) {
  const row = await db.blockDefinition.findFirst({ where: { id, shop } });
  if (!row) return null;
  const schema = safeParse<BlockSchema>(row.schema, { attributes: {}, fields: [] });
  const fields = normalizeBlockFields(schema.fields);
  schema.fields = fields;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    description: row.description ?? "",
    categorySlug: row.categorySlug,
    icon: row.icon,
    previewImage: row.previewImage,
    keywords: safeParse<string[]>(row.keywords, []),
    supports: safeParse<Record<string, unknown>>(row.supports, {}),
    schema,
    // Top-level fields mirror gutenberg-block-kit registry shape (riyasat-block-builder).
    fields,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ── create / update / delete / duplicate / status ───────────────────────────
export async function createBlock(shop: string, input: BlockInput, createdBy?: string | null) {
  const name = normalizeName(input.name);
  const schema = input.schema ?? { attributes: {}, fields: [] };
  schema.fields = normalizeBlockFields(schema.fields);
  return db.blockDefinition.create({
    data: {
      shop,
      name,
      title: input.title,
      description: input.description ?? null,
      categorySlug: input.categorySlug || "custom",
      icon: input.icon || "smiley",
      previewImage: input.previewImage ?? null,
      keywords: JSON.stringify(input.keywords ?? []),
      supports: JSON.stringify(input.supports ?? { html: false }),
      schema: JSON.stringify(schema),
      status: input.status ?? "draft",
      createdBy: createdBy ?? null,
    },
  });
}

export async function updateBlock(
  shop: string,
  id: string,
  input: Partial<BlockInput>,
  updatedBy?: string | null,
) {
  const existing = await db.blockDefinition.findFirst({ where: { id, shop } });
  if (!existing) throw new Error("Block not found");

  // Snapshot the current state before mutating.
  await db.blockVersion.create({
    data: {
      blockId: existing.id,
      version: existing.version,
      snapshot: JSON.stringify(existing),
      createdBy: updatedBy ?? null,
    },
  });

  const data: Record<string, unknown> = { version: existing.version + 1 };
  if (input.name !== undefined) data.name = normalizeName(input.name);
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.categorySlug !== undefined) data.categorySlug = input.categorySlug;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.previewImage !== undefined) data.previewImage = input.previewImage;
  if (input.keywords !== undefined) data.keywords = JSON.stringify(input.keywords);
  if (input.supports !== undefined) data.supports = JSON.stringify(input.supports);
  if (input.schema !== undefined) {
    const schema = { ...input.schema };
    schema.fields = normalizeBlockFields(schema.fields);
    data.schema = JSON.stringify(schema);
  }
  if (input.status !== undefined) data.status = input.status;

  return db.blockDefinition.update({ where: { id: existing.id }, data });
}

export async function deleteBlock(shop: string, id: string) {
  const existing = await db.blockDefinition.findFirst({ where: { id, shop } });
  if (!existing) throw new Error("Block not found");
  await db.blockDefinition.delete({ where: { id: existing.id } });
  return { ok: true };
}

export async function setBlockStatus(shop: string, id: string, status: BlockStatus) {
  const existing = await db.blockDefinition.findFirst({ where: { id, shop } });
  if (!existing) throw new Error("Block not found");
  return db.blockDefinition.update({ where: { id: existing.id }, data: { status } });
}

export async function duplicateBlock(shop: string, id: string) {
  const existing = await db.blockDefinition.findFirst({ where: { id, shop } });
  if (!existing) throw new Error("Block not found");

  // Find a free "<name>-copy[-n]" name for this shop.
  let base = `${existing.name}-copy`;
  let candidate = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await db.blockDefinition.findFirst({ where: { shop, name: candidate }, select: { id: true } })) {
    candidate = `${base}-${n++}`;
  }

  return db.blockDefinition.create({
    data: {
      shop,
      name: candidate,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      categorySlug: existing.categorySlug,
      icon: existing.icon,
      previewImage: existing.previewImage,
      keywords: existing.keywords,
      supports: existing.supports,
      schema: existing.schema,
      status: "draft",
    },
  });
}

// ── runtime registry (editor) ───────────────────────────────────────────────
/** Enabled blocks converted to the gutenberg-block-kit registry shape. */
export async function getEnabledRegistry(shop: string): Promise<BlockRegistryEntry[]> {
  const [rows, categories] = await Promise.all([
    db.blockDefinition.findMany({ where: { shop, status: "enabled" }, orderBy: { updatedAt: "desc" } }),
    listCategories(shop),
  ]);
  const catTitle = new Map(categories.map((c) => [c.slug, c.title]));

  return rows.map((r) => {
    const schema = safeParse<BlockSchema>(r.schema, { attributes: {}, fields: [] });
    const fields = normalizeBlockFields(schema.fields);
    return {
      name: r.name,
      title: r.title,
      description: r.description ?? "",
      category: r.categorySlug,
      categoryTitle: catTitle.get(r.categorySlug),
      icon: r.icon,
      previewImage: r.previewImage,
      keywords: safeParse<string[]>(r.keywords, []),
      supports: safeParse<Record<string, unknown>>(r.supports, { html: false }),
      attributes: schema.attributes ?? {},
      fields,
      ...(Array.isArray(schema.parent) && schema.parent.length ? { parent: schema.parent } : {}),
      ...(Array.isArray(schema.allowedBlocks) ? { allowedBlocks: schema.allowedBlocks } : {}),
    };
  });
}

/** Cheap cache key: count + latest updatedAt. Changes only when a block changes. */
export async function registrySignature(shop: string): Promise<string> {
  const agg = await db.blockDefinition.aggregate({
    where: { shop, status: "enabled" },
    _count: { _all: true },
    _max: { updatedAt: true },
  });
  const stamp = agg._max.updatedAt ? agg._max.updatedAt.getTime() : 0;
  return `"blocks-${agg._count._all}-${stamp}"`;
}
