import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { BlockForm, toFormValue } from "../components/cms/BlockForm";
import { getBlock, listCategories } from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [block, categories] = await Promise.all([
    getBlock(session.shop, params.id as string),
    listCategories(session.shop),
  ]);
  if (!block) {
    throw new Response("Block not found", { status: 404 });
  }
  return {
    block,
    categories: categories.map((c) => ({ slug: c.slug, title: c.title })),
  };
};

export default function EditBlock() {
  const { block, categories } = useLoaderData<typeof loader>();
  return (
    <BlockForm
      initial={toFormValue(block, categories[0]?.slug || "custom")}
      categories={categories}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
