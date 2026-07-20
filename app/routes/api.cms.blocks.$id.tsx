import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  deleteBlock,
  duplicateBlock,
  getBlock,
  setBlockStatus,
  updateBlock,
  type BlockStatus,
} from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

// GET /api/cms/blocks/:id — full block definition (for the edit screen / export).
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const block = await getBlock(session.shop, params.id as string);
  if (!block) return Response.json({ error: "Block not found" }, { status: 404 });
  return Response.json({ block });
};

// PUT/PATCH → update · DELETE → delete · POST { intent } → duplicate | toggle | status
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const id = params.id as string;
  const shop = session.shop;

  try {
    if (request.method === "DELETE") {
      await deleteBlock(shop, id);
      return Response.json({ ok: true });
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      const body = await request.json();
      const block = await updateBlock(shop, id, body, body.updatedBy);
      return Response.json({ block });
    }

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      switch (body.intent) {
        case "duplicate": {
          const block = await duplicateBlock(shop, id);
          return Response.json({ block }, { status: 201 });
        }
        case "toggle": {
          const current = await getBlock(shop, id);
          if (!current) return Response.json({ error: "Block not found" }, { status: 404 });
          const next: BlockStatus = current.status === "enabled" ? "disabled" : "enabled";
          const block = await setBlockStatus(shop, id, next);
          return Response.json({ block });
        }
        case "status": {
          const block = await setBlockStatus(shop, id, body.status as BlockStatus);
          return Response.json({ block });
        }
        default:
          return Response.json({ error: "Unknown intent" }, { status: 400 });
      }
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const status = message === "Block not found" ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
};
