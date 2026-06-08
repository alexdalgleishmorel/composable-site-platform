export type Route = 'projects' | 'about';

interface Props {
  route: Route;
  go: (r: Route) => void;
}

export const NavChip = ({ route, go }: Props) => (
  <div className="nav-chip glass">
    <button
      className={`nav-tab ${route === 'projects' ? 'active' : ''}`}
      onClick={() => go('projects')}
    >
      Projects
    </button>
    <button className={`nav-tab ${route === 'about' ? 'active' : ''}`} onClick={() => go('about')}>
      About
    </button>
    <span className={`nav-thumb ${route === 'about' ? 'right' : ''}`} aria-hidden />
  </div>
);
