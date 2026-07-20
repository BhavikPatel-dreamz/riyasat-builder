import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  deleteBlock,
  duplicateBlock,
  listBlocks,
  listCategories,
  setBlockStatus,
} from "../lib/blocks.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") || "").trim();
  const category = url.searchParams.get("category") || "";

  const [blocks, categories] = await Promise.all([
    listBlocks(session.shop, {
      search: search || undefined,
      category: category || undefined,
    }),
    listCategories(session.shop),
  ]);

  return { blocks, categories, search, category };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Missing block id." };

  try {
    if (intent === "delete") {
      await deleteBlock(session.shop, id);
      return { deleted: id };
    }
    if (intent === "duplicate") {
      const block = await duplicateBlock(session.shop, id);
      return { duplicated: block.id };
    }
    if (intent === "toggle") {
      const status = String(formData.get("status") || "");
      const next = status === "enabled" ? "disabled" : "enabled";
      await setBlockStatus(session.shop, id, next);
      return { toggled: id, status: next };
    }
    return { error: "Unknown action." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Request failed." };
  }
};

type BlockRow = ReturnType<typeof useLoaderData<typeof loader>>["blocks"][number];

function statusBadge(status: string) {
  if (status === "enabled") return <s-badge tone="success">Enabled</s-badge>;
  if (status === "disabled") return <s-badge tone="warning">Disabled</s-badge>;
  return <s-badge>Draft</s-badge>;
}

function RowActions({ block }: { block: BlockRow }) {
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";
  return (
    <s-stack direction="inline" gap="small">
      <s-button href={`/app/blocks/${block.id}`} variant="secondary">
        Edit
      </s-button>

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="toggle" />
        <input type="hidden" name="id" value={block.id} />
        <input type="hidden" name="status" value={block.status} />
        <s-button type="submit" variant="tertiary" {...(busy ? { loading: true } : {})}>
          {block.status === "enabled" ? "Disable" : "Enable"}
        </s-button>
      </fetcher.Form>

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="duplicate" />
        <input type="hidden" name="id" value={block.id} />
        <s-button type="submit" variant="tertiary" {...(busy ? { loading: true } : {})}>
          Duplicate
        </s-button>
      </fetcher.Form>

      <s-button
        href={`/api/cms/blocks/${block.id}`}
        target="_blank"
        variant="tertiary"
      >
        Export
      </s-button>

      <fetcher.Form
        method="post"
        onSubmit={(event) => {
          if (!window.confirm(`Delete “${block.title}”? This can't be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={block.id} />
        <s-button
          type="submit"
          variant="tertiary"
          tone="critical"
          {...(busy ? { loading: true } : {})}
        >
          Delete
        </s-button>
      </fetcher.Form>
    </s-stack>
  );
}

export default function BlockLibrary() {
  const { blocks, categories, search, category } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const catTitle = new Map(categories.map((c) => [c.slug, c.title]));

  return (
    <s-page heading="Block Library">
      <s-button slot="primary-action" href="/app/blocks/new">
        Create block
      </s-button>

      <s-section>
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="small">
            <s-search-field
              label="Search blocks"
              labelAccessibilityVisibility="exclusive"
              placeholder="Search by name or namespace"
              value={search}
              onInput={(e) => {
                const value = e.currentTarget.value;
                setSearchParams((prev) => {
                  if (value) prev.set("q", value);
                  else prev.delete("q");
                  return prev;
                }, { replace: true });
              }}
            ></s-search-field>

            <s-select
              label="Category"
              labelAccessibilityVisibility="exclusive"
              value={category}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setSearchParams((prev) => {
                  if (value) prev.set("category", value);
                  else prev.delete("category");
                  return prev;
                }, { replace: true });
              }}
            >
              <s-option value="">All categories</s-option>
              {categories.map((c) => (
                <s-option key={c.slug} value={c.slug}>
                  {c.title}
                </s-option>
              ))}
            </s-select>
          </s-stack>

          <s-heading>All blocks ({blocks.length})</s-heading>

          {blocks.length === 0 ? (
            <s-paragraph>
              No blocks yet.{" "}
              <s-link href="/app/blocks/new">Create your first block</s-link>.
            </s-paragraph>
          ) : (
            <s-table>
              <s-table-header-row>
                <s-table-header>Preview</s-table-header>
                <s-table-header>Block name</s-table-header>
                <s-table-header>Namespace</s-table-header>
                <s-table-header>Category</s-table-header>
                <s-table-header>Status</s-table-header>
                <s-table-header>Last updated</s-table-header>
                <s-table-header>Actions</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {blocks.map((block) => (
                  <s-table-row key={block.id}>
                    <s-table-cell>
                      {block.previewImage ? (
                        <img
                          src={block.previewImage}
                          alt=""
                          loading="lazy"
                          width={56}
                          height={40}
                          style={{ objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : (
                        <s-text color="subdued">—</s-text>
                      )}
                    </s-table-cell>
                    <s-table-cell>
                      <s-link href={`/app/blocks/${block.id}`}>{block.title}</s-link>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text color="subdued">{block.name}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text color="subdued">
                        {catTitle.get(block.categorySlug) || block.categorySlug}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>{statusBadge(block.status)}</s-table-cell>
                    <s-table-cell>
                      <s-text color="subdued">
                        {new Date(block.updatedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <RowActions block={block} />
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
