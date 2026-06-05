import { NavLink, Outlet } from 'react-router-dom';
import { useShopEnabled, useSiteContent } from './content-context';

export function Layout() {
  const { siteMeta } = useSiteContent();
  const shopEnabled = useShopEnabled();

  return (
    <>
      <header className="masthead">
        <NavLink to="/" className="wordmark">
          {siteMeta.siteName}
          <span className="lemon" aria-hidden="true" />
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end>
            index
          </NavLink>
          <NavLink to="/about">about</NavLink>
          {/* The shop link only appears once the shop is public (beta shops stay hidden). */}
          {shopEnabled && <NavLink to="/shop">shop</NavLink>}
        </nav>
      </header>

      <main className="wrap">
        <Outlet />
      </main>

      <footer className="footer">
        {siteMeta.contactEmail && (
          <a href={`mailto:${siteMeta.contactEmail}`}>{siteMeta.contactEmail}</a>
        )}
        {siteMeta.socialLinks?.map((link) => (
          <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
        {siteMeta.studioLocation && <span>{siteMeta.studioLocation}</span>}
        {siteMeta.hours && <span>{siteMeta.hours}</span>}
      </footer>
    </>
  );
}
