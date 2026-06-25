import { useEffect, useState, type ComponentType } from "react";

/**
 * SSR-safe loader for CmsEditorRouteSync. The sync module imports
 * gutenberg-block-kit/editor and must only load in the browser.
 */
export function CmsEditorRouteSyncHost() {
  const [Sync, setSync] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("./CmsEditorRouteSync").then((mod) => {
      if (!cancelled) {
        setSync(() => mod.CmsEditorRouteSync);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return Sync ? <Sync /> : null;
}
