import { createContext, useContext } from "react";

export type CmsEditorPageContextValue = {
  pageId?: string;
  initialTitle: string;
  initialContent?: string;
};

export const CmsEditorPageContext = createContext<CmsEditorPageContextValue>({
  initialTitle: "",
});

export function useCmsEditorPage() {
  return useContext(CmsEditorPageContext);
}
