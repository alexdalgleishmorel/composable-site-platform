import { useContent } from '@csp/bundle-kit';
import type { TenantContent } from '@csp/core';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ContentContext } from './content-context';
import { Layout } from './Layout';
import { About, Home, NotFound, ProjectDetail, Shop, ShopDetail } from './pages';
import { jmdmSeed } from './seed';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

/** The routed site, given already-resolved content. Split out so tests can render it directly. */
export function Site({ content, previewing }: { content: TenantContent; previewing?: boolean }) {
  return (
    <ContentContext.Provider value={content}>
      <ScrollToTop />
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
      <div className="frame-main" style={{ padding: '80px 24px', color: 'var(--mute)' }}>
        loading…
      </div>
    );
  }
  return <Site content={data} previewing={previewing} />;
}
