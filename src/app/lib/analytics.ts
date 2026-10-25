/**
 * Google Analytics 4 for the marketing site.
 *
 * The measurement ID defaults to the CityBucketList.com web stream so a
 * deploy tracks visits without a Netlify setting. Set VITE_GA_MEASUREMENT_ID
 * to send this build at a different stream. A blank value keeps the default.
 *
 * There is no analytics cookie banner on this site. The only consent control
 * is the SMS checkbox on the quick-join forms, and that does not cover
 * measurement. GA loads whenever an ID is configured.
 */

import { isDriverSignupUrl, storeOf, withAttribution } from './attribution';

/** CityBucketList.com web stream (GA4 property 560665181). */
export const DEFAULT_GA_MEASUREMENT_ID = 'G-0L2B3437BE';

const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function gaMeasurementId(): string {
  const fromEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    const id = fromEnv.trim();
    if (MEASUREMENT_ID.test(id)) return id;
    console.warn('[analytics] VITE_GA_MEASUREMENT_ID must look like G-XXXX. Using the default stream.');
  }
  return DEFAULT_GA_MEASUREMENT_ID;
}

let started = false;

/** Install gtag and load the GA4 library once. Safe to call more than once. */
export function initAnalytics(): void {
  if (started || typeof document === 'undefined') return;
  const id = gaMeasurementId();
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  // The route tracker sends page_view itself, including the first load,
  // so the automatic hit would double-count.
  window.gtag('config', id, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function trackPageView(pagePath: string): void {
  if (typeof window === 'undefined') return;
  initAnalytics();
  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  initAnalytics();
  window.gtag?.('event', name, params);
}

/** Events for the outbound CTAs we can see from this site. Signup completion
 *  (driver_sign_up / rider_sign_up) happens in the app, not here. */
export function trackOutboundClick(url: string): void {
  const store = storeOf(url);
  if (isDriverSignupUrl(url)) trackEvent('become_a_driver_click');
  else if (store) trackEvent('app_store_click', { store });
}

/** window.open wrapper that keeps first-touch campaign params on the URL. */
export function openAttributed(url: string): void {
  const next = withAttribution(url);
  trackOutboundClick(next);
  window.open(next, '_blank', 'noopener,noreferrer');
}
