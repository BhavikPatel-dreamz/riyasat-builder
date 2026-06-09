import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { CmsEditorShell } from "../components/cms/CmsEditorShell";
import { getPageById, listSelectablePages } from "../lib/cms.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [page, headers, footers] = await Promise.all([
    getPageById(session.shop, params.id || ""),
    listSelectablePages(session.shop, "header"),
    listSelectablePages(session.shop, "footer"),
  ]);

  if (!page) {
    throw new Response("Page not found", { status: 404 });
  }

  return { page, headers, footers };
};

export default function CmsEditPage() {
  const { page, headers, footers } = useLoaderData<typeof loader>();

  return (
    <CmsEditorShell
      pageId={page.id}
      contentType={page.type}
      previewSlug={page.type === "page" ? page.slug : undefined}
      initialTitle={page.title}
      initialContent={page.json || page.html}
      initialSlug={page.slug}
      initialDescription={page.description}
      initialSeoTitle={page.seoTitle}
      initialSeoDescription={page.seoDescription}
      initialOgImage={page.ogImage}
      initialKeywords={page.keywords}
      initialHideHeader={page.hideHeader}
      initialShowPageTitle={page.showPageTitle}
      initialBackgroundColor={page.backgroundColor}
      initialRenderingType={page.renderingType}
      initialHeaderId={page.headerId}
      initialFooterId={page.footerId}
      initialStickyHeaderId={page.stickyHeaderId}
      initialStickyFooterId={page.stickyFooterId}
      headers={headers}
      footers={footers}
    />
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
