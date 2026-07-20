import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { createCategory, listCategories } from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

// GET /api/cms/block-categories — inserter categories (seeds defaults on first call).
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const categories = await listCategories(session.shop);
  return Response.json({ categories });
};

// POST — create/upsert a custom category.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const body = await request.json();
  if (!body.slug || !body.title) {
    return Response.json({ error: "slug and title are required." }, { status: 400 });
  }
  const category = await createCategory(session.shop, {
    slug: body.slug,
    title: body.title,
    sortOrder: body.sortOrder,
  });
  return Response.json({ category }, { status: 201 });
};
