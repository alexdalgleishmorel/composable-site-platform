import { useContent } from '@csp/bundle-kit';
import type { TenantContent } from '@csp/core';
import { useEffect, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { AboutScreen } from './components/AboutScreen';
import { BioPanel } from './components/BioPanel';
import { DetailCard } from './components/DetailCard';
import { NavChip, type Route } from './components/NavChip';
import { ProjectScreen } from './components/ProjectScreen';
import { ProjectsPanel } from './components/ProjectsPanel';
import {
  ContentContext,
  useAboutLinks,
  useBioParagraphs,
  useProjects,
  useSiteContent,
} from './content-context';
import { useReducedMotion } from './scene/useReducedMotion';
import { useScene } from './scene/useScene';
import { alexSeed } from './seed';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * The laptop-scene stage. One cohesive surface: the scene frame + nav + bottom panel are chrome; the
 * "screen" content and the bottom panel swap with the route. The route is the URL (deep-linkable):
 * `/` browses, `/projects/:id` opens that project's detail, `/about` shows the link tiles. Carousel
 * selection is local on `/`; on a detail route it's driven by the `:id`.
 */
function Stage({ previewing }: { previewing?: boolean }) {
  const content = useSiteContent();
  const projects = useProjects();
  const bio = useBioParagraphs();
  const aboutLinks = useAboutLinks();

  const location = useLocation();
  const navigate = useNavigate();
  const route: Route = location.pathname.startsWith('/about') ? 'about' : 'projects';
  const detailId = matchPath('/projects/:id', location.pathname)?.params.id;

  const reducedMotion = useReducedMotion();
  const scene = useScene();
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [selected, setSelected] = useState(0);

  // Keep the carousel in sync with a deep-linked / opened detail project.
  useEffect(() => {
    if (!detailId) return;
    const i = projects.findIndex((p) => p.id === detailId);
    if (i >= 0) setSelected(i);
  }, [detailId, projects]);

  // Clamp the selection if the project list shrinks under it (e.g. a project removed in live preview),
  // so the screen never goes blank with a stale out-of-range index.
  useEffect(() => {
    if (selected > projects.length - 1) setSelected(Math.max(0, projects.length - 1));
  }, [projects.length, selected]);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const current = projects[selected];
  const detailProject = detailId ? projects.find((p) => p.id === detailId) : undefined;

  // Cover-fit math: oversize the stage so its intrinsic aspect fills the whole viewport, then
  // absolutely center it; .stage-wrap's overflow:hidden clips the overflow (no gradient bars).
  const sceneAR = scene.width / scene.height;
  const stageW = Math.max(vp.w, vp.h * sceneAR);
  const stageH = Math.max(vp.h, vp.w / sceneAR);
  const stageStyle = {
    position: 'absolute' as const,
    width: `${stageW}px`,
    height: `${stageH}px`,
    left: `${(vp.w - stageW) / 2}px`,
    top: `${(vp.h - stageH) / 2}px`,
  };

  const go = (r: Route) => navigate(r === 'about' ? '/about' : '/');
  const openDetail = (i?: number) => {
    const p = projects[i ?? selected];
    if (p) navigate(`/projects/${p.id}`);
  };

  return (
    <div className="app">
      {previewing && <div className="preview-banner">live preview</div>}
      <div className="stage-wrap">
        <div className="stage" style={stageStyle}>
          <img className="bg" src={scene.src} alt="" />

          <div
            className={`screen ${route === 'projects' ? 'screen-clickable' : ''}`}
            onClick={() => {
              if (route === 'projects' && current) navigate(`/projects/${current.id}`);
            }}
            style={{
              left: scene.bbox.left + '%',
              top: scene.bbox.top + '%',
              width: scene.bbox.width + '%',
              height: scene.bbox.height + '%',
            }}
          >
            <div className={`screen-inner route-${route}`}>
              {route === 'projects' && current && (
                <div key={current.id} className="screen-fade">
                  <ProjectScreen project={current} reducedMotion={reducedMotion} />
                </div>
              )}
              {route === 'about' && (
                <div key="about" className="screen-fade">
                  <AboutScreen links={aboutLinks} />
                </div>
              )}
            </div>
            <div className="screen-gloss" aria-hidden />
          </div>

          <div className="ui-nav">
            <div className="brand-name">{content.siteMeta.siteName}</div>
            <div className="brand-role">{content.siteMeta.tagline ?? ''}</div>
            <NavChip route={route} go={go} />
          </div>

          <div className="ui-panel">
            {route === 'projects' && projects.length > 0 && (
              <ProjectsPanel
                projects={projects}
                selected={selected}
                setSelected={setSelected}
                openDetail={openDetail}
                isDetailOpen={!!detailProject}
              />
            )}
            {route === 'about' && <BioPanel paragraphs={bio} />}
          </div>

          {detailProject && route === 'projects' && (
            <DetailCard project={detailProject} onClose={() => navigate('/')} />
          )}
        </div>
      </div>
    </div>
  );
}

/** The site given already-resolved content. Split out so tests can render it under a MemoryRouter. */
export function Site({ content, previewing }: { content: TenantContent; previewing?: boolean }) {
  return (
    <ContentContext.Provider value={content}>
      <Stage previewing={previewing} />
    </ContentContext.Provider>
  );
}

export function App() {
  const { content, error, previewing } = useContent(API_BASE);
  // Dev / standalone fallback: render the committed seed when the API isn't reachable.
  const data = content ?? (error ? alexSeed : null);
  if (!data) {
    return (
      <div className="app" style={{ padding: '80px 24px', color: '#9aa' }}>
        loading…
      </div>
    );
  }
  return <Site content={data} previewing={previewing} />;
}
