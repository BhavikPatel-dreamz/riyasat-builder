import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { CmsEditorShell } from "../components/cms/CmsEditorShell";
import { listSelectablePages, type PageType } from "../lib/cms.server";
import { authenticate } from "../shopify.server";

function resolveType(value: string | null): PageType {
  return value === "header" || value === "footer" ? value : "page";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const type = resolveType(new URL(request.url).searchParams.get("type"));

  // Header/footer pickers are only needed when building a page.
  const [headers, footers] =
    type === "page"
      ? await Promise.all([
          listSelectablePages(session.shop, "header"),
          listSelectablePages(session.shop, "footer"),
        ])
      : [[], []];

  return { type, headers, footers };
};

export default function CmsNewPage() {
  const { type, headers, footers } = useLoaderData<typeof loader>();
  const label =
    type === "header" ? "header" : type === "footer" ? "footer" : "page";

  return (
    <CmsEditorShell
      isNew
      contentType={type}
      initialTitle={`Untitled ${label}`}
      headers={headers}
      footers={footers}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
