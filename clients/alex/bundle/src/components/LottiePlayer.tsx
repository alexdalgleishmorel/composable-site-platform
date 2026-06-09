import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';
import { AccentFill } from './AccentFill';

/**
 * Plays an uploaded Lottie animation from its CDN URL. lottie-react takes parsed `animationData`, so we
 * fetch the JSON ourselves; until it resolves (or if it errors) we show the accent fill. This module is
 * lazy-loaded (see `Animation.tsx`) so lottie-web stays out of the main bundle and only loads when a
 * project actually uses an uploaded animation.
 */
const LottiePlayer = ({ url }: { url: string }) => {
  const [data, setData] = useState<object | null>(null);
  useEffect(() => {
    let active = true;
    setData(null);
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (active) setData(json as object);
      })
      .catch((err) => {
        // Keep the accent fill on failure, but surface why — a silent catch here made a missing-CORS
        // fallback hard to diagnose (the fetch is cross-origin to the uploads CDN).
        console.warn(`LottiePlayer: failed to load animation from ${url}`, err);
      });
    return () => {
      active = false;
    };
  }, [url]);

  if (!data) return <AccentFill />;
  return <Lottie animationData={data} loop autoplay style={{ width: '100%', height: '100%' }} />;
};

export default LottiePlayer;
