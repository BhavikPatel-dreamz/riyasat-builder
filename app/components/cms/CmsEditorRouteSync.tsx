import { useEffect, useRef } from "react";
import { useEditor } from "gutenberg-block-kit/editor";

import { useCmsEditorPage } from "./CmsEditorPageContext";

function parseBlocks(content: string) {
  return JSON.parse(content);
}

/** Loads the selected page into the mounted editor when the route changes. */
export function CmsEditorRouteSync() {
  const { pageId, initialTitle, initialContent } = useCmsEditorPage();
  const { setBlocks, setPageTitle } = useEditor();
  const activePageIdRef = useRef<string | undefined>(pageId);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      activePageIdRef.current = pageId;
      return;
    }

    if (!pageId || activePageIdRef.current === pageId) {
      return;
    }

    let cancelled = false;
    activePageIdRef.current = pageId;

    async function loadPageIntoEditor() {
      if (initialTitle) {
        setPageTitle(initialTitle);
      }

      if (initialContent) {
        try {
          const blocks = parseBlocks(initialContent);
          if (!cancelled) {
            setBlocks(blocks);
          }
          return;
        } catch {
          // Fall back to API fetch below.
        }
      }

      const response = await fetch(`/api/cms/pages/${pageId}`);
      if (!response.ok || cancelled) {
        return;
      }

      const page = await response.json();
      if (cancelled) {
        return;
      }

      if (page.title) {
        setPageTitle(page.title);
      }

      if (page.json) {
        const blocks =
          typeof page.json === "string" ? parseBlocks(page.json) : page.json;
        setBlocks(blocks);
      }
    }

    loadPageIntoEditor().catch(() => {
      if (!cancelled) {
        activePageIdRef.current = undefined;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pageId, initialContent, initialTitle, setBlocks, setPageTitle]);

  return null;
}
