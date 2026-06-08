import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Theme + density for the editor chrome. The editor is a platform-level tool with its own identity —
 * this never inherits any client's branding. State is persisted to localStorage and applied to
 * `<html>` as `data-theme` + a `--density` multiplier; the swap suppresses transitions for one frame
 * so it's instant and never freezes mid-transition (README §Theme application).
 */
export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'regular' | 'comfy';

const DENSITY_SCALE: Record<Density, number> = { compact: 0.86, regular: 1, comfy: 1.18 };
const THEME_KEY = 'knit-theme';
const DENSITY_KEY = 'knit-density';

interface ThemeApi {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeApi | null>(null);

/** Read the initial theme: stored preference first, else the OS setting, else light. */
function initialTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function initialDensity(): Density {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored === 'compact' || stored === 'regular' || stored === 'comfy') return stored;
  }
  return 'regular';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [density, setDensityState] = useState<Density>(initialDensity);

  // Apply to <html>, suppressing transitions for one frame so the swap is instant.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--density', String(DENSITY_SCALE[density]));
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-switching')),
    );
    return () => cancelAnimationFrame(raf);
  }, [theme, density]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, t);
  };
  const setDensity = (d: Density) => {
    setDensityState(d);
    if (typeof localStorage !== 'undefined') localStorage.setItem(DENSITY_KEY, d);
  };

  return (
    <ThemeContext.Provider value={{ theme, density, setTheme, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeApi {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
