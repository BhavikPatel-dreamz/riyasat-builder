import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  createBlock,
  getEnabledRegistry,
  listBlocks,
  registrySignature,
} from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

// GET /api/cms/blocks
//   ?registry=1        → enabled blocks in gutenberg-block-kit registry shape
//                        (ETag-cached; editor uses this to register dynamically)
//   otherwise          → admin list (search, category, status filters)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);

  if (url.searchParams.get("registry") === "1") {
    const etag = await registrySignature(session.shop);
    if (request.headers.get("If-None-Match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }
    const registry = await getEnabledRegistry(session.shop);
    return Response.json(
      { registry },
      { headers: { ETag: etag, "Cache-Control": "private, max-age=0, must-revalidate" } },
    );
  }

  const blocks = await listBlocks(session.shop, {
    search: url.searchParams.get("search") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  return Response.json({ blocks });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  if (!body.name || !body.title) {
    return Response.json({ error: "name and title are required." }, { status: 400 });
  }

  try {
    const block = await createBlock(
      session.shop,
      {
        name: body.name,
        title: body.title,
        description: body.description,
        categorySlug: body.categorySlug,
        icon: body.icon,
        previewImage: body.previewImage,
        keywords: body.keywords,
        supports: body.supports,
        schema: body.schema,
        status: body.status,
      },
      body.createdBy,
    );
    return Response.json({ block }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create block.";
    // Unique constraint on (shop, name).
    const status = message.includes("Unique constraint") ? 409 : 500;
    return Response.json({ error: status === 409 ? "A block with that namespace already exists." : message }, { status });
  }
};
