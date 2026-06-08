import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { listPages, updatePage } from "../lib/cms.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const pages = await listPages(session.shop);

  return { pages };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const pageId = String(formData.get("pageId") || "");
  const status = String(formData.get("status") || "");

  if (!pageId || !["draft", "published"].includes(status)) {
    return { error: "Invalid publish request." };
  }

  const page = await updatePage(session.shop, pageId, {
    status: status as "draft" | "published",
  });

  if (!page) {
    return { error: "Page not found." };
  }

  return { page };
};

export default function CmsIndex() {
  const { pages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  return (
    <s-page heading="CMS Pages">
      <s-button slot="primary-action" href="/app/cms/new">
        Create page
      </s-button>

      <s-section heading="All pages">
        {pages.length === 0 ? (
          <s-paragraph>
            No pages yet.{" "}
            <s-link href="/app/cms/new">Create your first page</s-link>.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {pages.map((page) => (
              <s-box
                key={page.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <s-stack direction="inline" gap="base">
                  <s-stack direction="block" gap="small">
                    <s-heading>{page.title}</s-heading>
                    <s-text>
                      /{page.slug} · {page.status} · Updated{" "}
                      {new Date(page.updatedAt).toLocaleString()}
                    </s-text>
                  </s-stack>
                  <s-button href={`/app/cms/${page.id}`} variant="tertiary">
                    Edit
                  </s-button>
                  <fetcher.Form method="post">
                    <input type="hidden" name="pageId" value={page.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={page.status === "published" ? "draft" : "published"}
                    />
                    <s-button
                      type="submit"
                      variant="tertiary"
                      {...(fetcher.state !== "idle" ? { loading: true } : {})}
                    >
                      {page.status === "published" ? "Unpublish" : "Publish"}
                    </s-button>
                  </fetcher.Form>
                  {page.status === "published" ? (
                    <s-button
                      href={`/pages/${page.slug}`}
                      target="_blank"
                      variant="tertiary"
                    >
                      Preview
                    </s-button>
                  ) : null}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
