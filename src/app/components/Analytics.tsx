import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { captureFirstTouch, withAttribution } from '../lib/attribution';
import { initAnalytics, trackOutboundClick, trackPageView } from '../lib/analytics';

/**
 * SPA page views plus click-time campaign params on outbound signup and
 * store links. Renders nothing.
 */
export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    captureFirstTouch();
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const next = withAttribution(href);
      if (next !== href) anchor.setAttribute('href', next);
      trackOutboundClick(next);
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
    };
  }, []);

  return null;
}
