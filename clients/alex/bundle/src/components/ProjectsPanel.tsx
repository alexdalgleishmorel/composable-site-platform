import type { PortfolioProject } from '@csp/blocks';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../scene/useReducedMotion';

const AUTO_ADVANCE_MS = 6000;

interface Props {
  projects: PortfolioProject[];
  selected: number;
  setSelected: (i: number) => void;
  openDetail: (i?: number) => void;
  isDetailOpen: boolean;
}

interface DragState {
  down: boolean;
  startX: number;
  startScroll: number;
  dragged: boolean;
  captured?: boolean;
  pid?: number;
}

interface CarouselItem {
  project: PortfolioProject;
  realIdx: number;
  isClone: boolean;
  key: string;
}

export const ProjectsPanel = ({
  projects,
  selected,
  setSelected,
  openDetail,
  isDetailOpen,
}: Props) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const dragRef = useRef<DragState>({ down: false, startX: 0, startScroll: 0, dragged: false });
  const lastSelRef = useRef(selected);
  const reducedMotion = useReducedMotion();

  // To support native swipe wrap-around we render N+2 items: a clone of the
  // last project at the start and a clone of the first at the end. Real
  // project i lives at scroller index i+1; the clones at 0 and N+1 are
  // intercepted on settle and replaced with an instant scrollLeft jump to
  // the matching real item, giving the visual feel of an infinite carousel.
  const hasClones = projects.length > 1;
  const items: CarouselItem[] = hasClones
    ? [
        {
          project: projects[projects.length - 1]!,
          realIdx: projects.length - 1,
          isClone: true,
          key: 'clone-leading',
        },
        ...projects.map((p, i) => ({
          project: p,
          realIdx: i,
          isClone: false,
          key: p.id,
        })),
        { project: projects[0]!, realIdx: 0, isClone: true, key: 'clone-trailing' },
      ]
    : projects.map((p, i) => ({ project: p, realIdx: i, isClone: false, key: p.id }));

  const realToScroller = (real: number) => (hasClones ? real + 1 : real);

  // Mount-only: if we have clones, snap initial scrollLeft past the leading
  // clone so the user starts on the actual selected project, not the clone.
  useEffect(() => {
    if (!hasClones) return;
    const sc = scrollerRef.current;
    const el = itemsRef.current[realToScroller(selected)];
    if (sc && el) sc.scrollLeft = el.offsetLeft;
    // Mount-only: intentionally runs once to set the initial scroll position.
  }, []);

  useEffect(() => {
    const sc = scrollerRef.current;
    const el = itemsRef.current[realToScroller(selected)];
    if (!sc || !el) return;
    if (lastSelRef.current === selected) return;
    const prev = lastSelRef.current;
    lastSelRef.current = selected;
    const isLongJump = Math.abs(selected - prev) > 1;
    sc.scrollTo({ left: el.offsetLeft, behavior: isLongJump ? 'auto' : 'smooth' });
  }, [selected, hasClones]);

  useEffect(() => {
    if (isDetailOpen || reducedMotion || projects.length <= 1) return;
    const id = window.setTimeout(() => {
      setSelected((selected + 1) % projects.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [selected, isDetailOpen, reducedMotion, projects.length, setSelected]);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      dragRef.current = {
        down: true,
        startX: e.clientX,
        startScroll: sc.scrollLeft,
        dragged: false,
        captured: false,
        pid: e.pointerId,
      };
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.down) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 4) {
        if (!d.dragged) {
          d.dragged = true;
          try {
            if (d.pid !== undefined) sc.setPointerCapture?.(d.pid);
            d.captured = true;
          } catch {
            /* noop */
          }
        }
        sc.scrollLeft = d.startScroll - dx;
      }
    };
    const onUp = () => {
      const d = dragRef.current;
      if (!d.down) return;
      d.down = false;
      if (d.captured && d.pid !== undefined) {
        try {
          sc.releasePointerCapture?.(d.pid);
        } catch {
          /* noop */
        }
      }
      if (d.dragged) {
        setTimeout(() => {
          dragRef.current.dragged = false;
        }, 50);
      }
    };
    sc.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      sc.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    // Debounce so we only commit a new selection once the scroll-snap
    // animation has fully settled — otherwise a single swipe can fire
    // overlapping setSelected calls (A→B→A→B) and re-trigger the screen-fade
    // mount animation mid-transition, causing a visible flicker.
    let settleTimer = 0;
    const onScroll = () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const w = sc.clientWidth;
        if (!w) return;
        // Derive the count from the current items, not itemsRef — the ref array keeps a stale (sparse)
        // length when the project list shrinks, which would mis-detect the clone wrap boundary.
        const total = hasClones ? projects.length + 2 : projects.length;
        const scrollerIdx = Math.max(0, Math.min(total - 1, Math.round(sc.scrollLeft / w)));

        // Wrap detection: if we landed on a clone, jump scroll to the
        // matching real item without animation, then update selected.
        if (hasClones && scrollerIdx === 0) {
          const realLastEl = itemsRef.current[total - 2];
          if (realLastEl) sc.scrollLeft = realLastEl.offsetLeft;
          const realIdx = projects.length - 1;
          if (realIdx !== selected) {
            lastSelRef.current = realIdx;
            setSelected(realIdx);
          }
          return;
        }
        if (hasClones && scrollerIdx === total - 1) {
          const realFirstEl = itemsRef.current[1];
          if (realFirstEl) sc.scrollLeft = realFirstEl.offsetLeft;
          if (selected !== 0) {
            lastSelRef.current = 0;
            setSelected(0);
          }
          return;
        }

        const realIdx = hasClones ? scrollerIdx - 1 : scrollerIdx;
        const clamped = Math.max(0, Math.min(projects.length - 1, realIdx));
        if (clamped !== selected) {
          lastSelRef.current = clamped;
          setSelected(clamped);
        }
      }, 50);
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      sc.removeEventListener('scroll', onScroll);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [selected, setSelected, projects.length, hasClones]);

  return (
    <div className="panel glass projects-panel">
      <div className="panel-body">
        <button
          className="nav-arrow"
          aria-label="Previous project"
          onClick={() => setSelected((selected - 1 + projects.length) % projects.length)}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="proj-scroller" ref={scrollerRef}>
          <div className="proj-scroller-inner">
            {items.map((item, idx) => (
              <button
                key={item.key}
                ref={(el) => {
                  itemsRef.current[idx] = el;
                }}
                className={`proj-item ${!item.isClone && item.realIdx === selected ? 'active' : ''}`}
                aria-hidden={item.isClone}
                onClick={(e) => {
                  if (dragRef.current.dragged) {
                    e.preventDefault();
                    return;
                  }
                  setSelected(item.realIdx);
                  openDetail(item.realIdx);
                }}
              >
                <div className="proj-name">{item.project.name}</div>
                <div className="proj-tags">CLICK TO LEARN MORE</div>
              </button>
            ))}
          </div>
        </div>
        <button
          className="nav-arrow"
          aria-label="Next project"
          onClick={() => setSelected((selected + 1) % projects.length)}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div className="dots">
        {projects.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === selected ? 'on' : ''}`}
            aria-label={`Go to project ${i + 1}`}
            onClick={() => setSelected(i)}
          />
        ))}
      </div>
    </div>
  );
};
