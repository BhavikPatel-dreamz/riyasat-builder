import db from "../db.server";

export type PageStatus = "draft" | "published";

export type PageRecord = {
  id: string;
  title: string;
  slug: string;
  html: string;
  json: string;
  status: PageStatus;
  updatedAt: string;
};

function serializePage(page: {
  id: string;
  title: string;
  slug: string;
  html: string;
  json: string;
  status: string;
  updatedAt: Date;
}): PageRecord {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    html: page.html,
    json: page.json,
    status: page.status as PageStatus,
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function listPages(shop: string) {
  const pages = await db.page.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
  });

  return pages.map(serializePage);
}

export async function getPageById(shop: string, id: string) {
  const page = await db.page.findFirst({
    where: { id, shop },
  });

  return page ? serializePage(page) : null;
}

export async function getPageBySlug(shop: string, slug: string) {
  const page = await db.page.findFirst({
    where: { shop, slug, status: "published" },
  });

  return page ? serializePage(page) : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function createPage(
  shop: string,
  data: {
    title: string;
    slug?: string;
    html: string;
    json: string;
    status?: PageStatus;
  },
) {
  const slug = slugify(data.slug || data.title) || "page";

  const existing = await db.page.findFirst({
    where: { shop, slug },
  });

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const page = await db.page.create({
    data: {
      shop,
      title: data.title,
      slug: finalSlug,
      html: data.html,
      json: data.json,
      status: data.status ?? "draft",
    },
  });

  return serializePage(page);
}

export async function updatePage(
  shop: string,
  id: string,
  data: {
    title?: string;
    slug?: string;
    html?: string;
    json?: string;
    status?: PageStatus;
  },
) {
  const existing = await db.page.findFirst({
    where: { id, shop },
  });

  if (!existing) {
    return null;
  }

  const nextSlug = data.slug ? slugify(data.slug) : undefined;

  if (nextSlug && nextSlug !== existing.slug) {
    const conflict = await db.page.findFirst({
      where: { shop, slug: nextSlug, NOT: { id } },
    });

    if (conflict) {
      throw new Error("A page with this slug already exists.");
    }
  }

  const page = await db.page.update({
    where: { id },
    data: {
      title: data.title,
      slug: nextSlug,
      html: data.html,
      json: data.json,
      status: data.status,
    },
  });

  return serializePage(page);
}

export async function deletePage(shop: string, id: string) {
  const existing = await db.page.findFirst({
    where: { id, shop },
  });

  if (!existing) {
    return false;
  }

  await db.page.delete({ where: { id } });
  return true;
}

export async function createMediaRecord(
  shop: string,
  data: {
    shopifyFileId?: string;
    url: string;
    alt?: string;
    title?: string;
    mimeType?: string;
  },
) {
  return db.media.create({
    data: {
      shop,
      shopifyFileId: data.shopifyFileId,
      url: data.url,
      alt: data.alt,
      title: data.title,
      mimeType: data.mimeType,
    },
  });
}
