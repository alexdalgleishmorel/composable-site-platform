import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useShopEnabled, useSiteContent } from './content-context';

export function Layout() {
  const { siteMeta } = useSiteContent();
  const shopEnabled = useShopEnabled();
  const location = useLocation();
  const [miniVisible, setMiniVisible] = useState(false);

  // The masthead scrolls away; a fixed mini-nav slides in past 140px and retracts under 60px.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setMiniVisible((prev) => (y > 140 ? true : y < 60 ? false : prev));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const projectsActive = location.pathname === '/' || location.pathname.startsWith('/projects');

  const nav = (
    <nav className="nav">
      <NavLink to="/" className={projectsActive ? 'is-active' : undefined} end>
        projects
      </NavLink>
      {shopEnabled && (
        <NavLink to="/shop" className={({ isActive }) => (isActive ? 'is-active' : '')}>
          shop
        </NavLink>
      )}
      <NavLink to="/about" className={({ isActive }) => (isActive ? 'is-active' : '')}>
        about
      </NavLink>
    </nav>
  );

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__row">
          <NavLink to="/" className="wordmark" aria-label={`${siteMeta.siteName} — home`}>
            <img
              className="wordmark__lockup"
              src="/jmdm-lockup.svg"
              alt={siteMeta.siteName}
              draggable={false}
            />
          </NavLink>
          <div className="bar" />
          {nav}
        </div>
      </header>

      <div className={miniVisible ? 'mini-nav is-visible' : 'mini-nav'}>{nav}</div>

      <main className="frame-main">
        <Outlet />
      </main>

      <footer className="foot">
        <div className="foot__col foot__col--contact">
          <h6>contact</h6>
          {siteMeta.contactEmail && (
            <a href={`mailto:${siteMeta.contactEmail}`}>{siteMeta.contactEmail}</a>
          )}
          {siteMeta.socialLinks?.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
              instagram · {link.label}
            </a>
          ))}
          {siteMeta.studioLocation && <span className="foot__line">{siteMeta.studioLocation}</span>}
        </div>
        <div className="foot__col foot__col--copy">
          <div>
            © {siteMeta.siteName} — jack dalgleish-morel, 2026
            {siteMeta.hours ? ` · ${siteMeta.hours}` : ''}
          </div>
        </div>
      </footer>
    </div>
  );
}
