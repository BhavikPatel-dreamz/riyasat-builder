import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { BlockForm, toFormValue } from "../components/cms/BlockForm";
import { listCategories } from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const categories = await listCategories(session.shop);
  return {
    categories: categories.map((c) => ({ slug: c.slug, title: c.title })),
  };
};

export default function NewBlock() {
  const { categories } = useLoaderData<typeof loader>();
  return (
    <BlockForm
      initial={toFormValue(null, categories[0]?.slug || "custom")}
      categories={categories}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
