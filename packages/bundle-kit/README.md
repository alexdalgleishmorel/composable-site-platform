# @csp/bundle-kit — client-bundle contract

The shared runtime every per-client bundle implements (ARCHITECTURE.md §7). A bundle ships **render
components, theme, and page composition — never schemas or edit forms.**

Every bundle owes the platform exactly three things, all provided here:

1. **Fetch content on load** — `useContent(apiBaseUrl)` calls `GET {apiBaseUrl}/content`.
2. **Render blocks by `type`** — `<BlockRenderer>` / `<PageRenderer>` map a block's `type` to the
   bundle's bespoke `RenderMap` entry (the join key across the three planes, §2).
3. **Accept the admin preview** — `useContent` also listens for the admin app's `postMessage`
   (`PREVIEW_MESSAGE_TYPE`) and re-renders from the working payload instead of refetching.

```tsx
import { useContent, PageRenderer, findPage, type RenderMap } from '@csp/bundle-kit';

const renderers: RenderMap = {
  richText: RichTextRender, // bespoke, this client's look
  projectGrid: ProjectGridRender,
  shop: ShopRender,
  // …only the types this bundle uses
};

export function App() {
  const { content, loading, error } = useContent(import.meta.env.VITE_API_BASE_URL);
  if (loading) return <Splash />;
  if (error || !content) return <ErrorPage />;
  const home = findPage(content, '/');
  return home ? <PageRenderer renderers={renderers} page={home} /> : null;
}
```

The admin side posts previews with `postPreview(iframe.contentWindow, workingContent)`.
