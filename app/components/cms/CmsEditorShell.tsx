import { useCallback, useEffect } from "react";
import { ClientBlockEditor } from "gutenberg-block-kit/editor-client";

type CmsEditorShellProps = {
  pageId?: string;
  initialTitle?: string;
  initialContent?: string;
  isNew?: boolean;
  previewSlug?: string;
  onSaved?: (pageId: string) => void;
};

function EditorFallback() {
  return (
    <s-page heading="CMS Editor">
      <s-section>
        <s-paragraph>Loading editor…</s-paragraph>
      </s-section>
    </s-page>
  );
}

async function fetchPage(pageId: string) {
  const response = await fetch(`/api/cms/pages/${pageId}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export function CmsEditorShell({
  pageId,
  initialTitle = "Untitled page",
  initialContent,
  isNew = false,
  previewSlug,
  onSaved,
}: CmsEditorShellProps) {
  useEffect(() => {
    import("gutenberg-block-kit/styles");
  }, []);

  const onSave = useCallback(
    async ({
      id,
      title,
      html,
      json,
    }: {
      id: string;
      title: string;
      html: string;
      json: string;
    }) => {
      const payload = {
        title,
        html,
        json,
        slug: id,
      };

      const response = isNew
        ? await fetch("/api/cms/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/cms/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save page.");
      }

      const saved = await response.json();
      onSaved?.(saved.id);
      return saved;
    },
    [isNew, onSaved, pageId],
  );

  const onLoad = useCallback(
    async (id: string) => {
      if (isNew) {
        return null;
      }

      return fetchPage(id);
    },
    [isNew],
  );

  const listImages = useCallback(
    async ({
      page,
      perPage,
      search,
    }: {
      page: number;
      perPage: number;
      search: string;
    }) => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        q: search,
      });

      const response = await fetch(`/api/cms/media?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load media library.");
      }

      return response.json();
    },
    [],
  );

  const uploadImage = useCallback(async (file: File) => {
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/cms/media", {
      method: "POST",
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to upload image.");
    }

    return response.json();
  }, []);

  return (
    <div className="cms-editor-shell">
      <ClientBlockEditor
        fallback={<EditorFallback />}
        initialPageId={pageId}
        initialTitle={initialTitle}
        initialContent={initialContent}
        onSave={onSave}
        onLoad={onLoad}
        media={{
          perPage: 20,
          listImages,
          uploadImage,
        }}
        onViewSite={
          previewSlug
            ? () => {
                window.open(
                  `/pages/${previewSlug}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }
            : undefined
        }
      />
    </div>
  );
}
