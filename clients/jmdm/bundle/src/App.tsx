import type { TenantContent } from '@csp/core';
import { useContent } from '@csp/bundle-kit';
import { Route, Routes } from 'react-router-dom';
import { ContentContext } from './content-context';
import { Layout } from './Layout';
import { About, Home, NotFound, ProjectDetail, Shop, ShopDetail } from './pages';
import { jmdmSeed } from './seed';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

/** The routed site, given already-resolved content. Split out so tests can render it directly. */
export function Site({ content, previewing }: { content: TenantContent; previewing?: boolean }) {
  return (
    <ContentContext.Provider value={content}>
      {previewing && <div className="preview-banner">live preview</div>}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/shop/:slug" element={<ShopDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ContentContext.Provider>
  );
}

export function App() {
  const { content, error, previewing } = useContent(API_BASE);
  // Dev / standalone fallback: render the committed seed when the API isn't reachable.
  const data = content ?? (error ? jmdmSeed : null);
  if (!data) {
    return (
      <div className="wrap" style={{ padding: '80px 24px', color: 'var(--mute)' }}>
        loading…
      </div>
    );
  }
  return <Site content={data} previewing={previewing} />;
}
