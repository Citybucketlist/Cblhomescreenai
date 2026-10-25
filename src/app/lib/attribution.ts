/**
 * First-touch campaign attribution for visits that start on the marketing site.
 *
 * Stored in localStorage for 90 days. Later visits in that window do not
 * overwrite it. The driver and rider records are created in the app
 * (app.citybucketlist.com), which cannot read this origin's localStorage, so
 * signup and store links are stamped with the saved values at click time.
 *
 * `ref` is intentionally not added. Rider signup treats that parameter as a
 * member referral code, which is a different system from campaign UTMs.
 */

const STORAGE_KEY = 'cbl_first_touch_v1';
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type UtmKey = (typeof UTM_KEYS)[number];

export type FirstTouch = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
  captured_at: number;
};

const COLUMN_FOR: Record<UtmKey | 'referrer' | 'landing_path', string> = {
  utm_source: 'signup_utm_source',
  utm_medium: 'signup_utm_medium',
  utm_campaign: 'signup_utm_campaign',
  utm_content: 'signup_utm_content',
  utm_term: 'signup_utm_term',
  referrer: 'signup_referrer',
  landing_path: 'signup_landing_path',
};

function clean(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function readStored(): FirstTouch | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FirstTouch>;
    if (typeof parsed.captured_at !== 'number') return null;
    const age = Date.now() - parsed.captured_at;
    if (age < 0 || age > MAX_AGE_MS) return null;
    return {
      utm_source: clean(parsed.utm_source, 120),
      utm_medium: clean(parsed.utm_medium, 120),
      utm_campaign: clean(parsed.utm_campaign, 120),
      utm_content: clean(parsed.utm_content, 120),
      utm_term: clean(parsed.utm_term, 120),
      referrer: clean(parsed.referrer, 300),
      landing_path: clean(parsed.landing_path, 200),
      captured_at: parsed.captured_at,
    };
  } catch {
    return null;
  }
}

function writeStored(touch: FirstTouch): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
  } catch {
    /* private mode or a full quota — attribution is best-effort */
  }
}

/** Remember this landing if we do not already have a fresh first touch. */
export function captureFirstTouch(): FirstTouch | null {
  if (typeof window === 'undefined') return null;
  const existing = readStored();
  if (existing) return existing;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
  const touch: FirstTouch = {
    utm_source: clean(params.get('utm_source'), 120),
    utm_medium: clean(params.get('utm_medium'), 120),
    utm_campaign: clean(params.get('utm_campaign'), 120),
    utm_content: clean(params.get('utm_content'), 120),
    utm_term: clean(params.get('utm_term'), 120),
    referrer: clean(document.referrer, 300),
    landing_path: clean(`${window.location.pathname}${window.location.search}`, 200),
    captured_at: Date.now(),
  };
  writeStored(touch);
  return touch;
}

export function getFirstTouch(): FirstTouch | null {
  return readStored();
}

/** Column values for a drivers/riders insert. Empty fields are omitted so a
 *  write does not depend on unused keys. This repo does not insert those
 *  rows; the app signup should spread this in after the migration is applied. */
export function signupColumnValues(touch: FirstTouch | null = getFirstTouch()): Record<string, string> {
  if (!touch) return {};
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = touch[key];
    if (value) out[COLUMN_FOR[key]] = value;
  }
  if (touch.referrer) out[COLUMN_FOR.referrer] = touch.referrer;
  if (touch.landing_path) out[COLUMN_FOR.landing_path] = touch.landing_path;
  return out;
}

function isSignupEntry(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'app.citybucketlist.com') return false;
  const path = url.pathname.replace(/\/$/, '') || '/';
  return path === '/' || path === '/rider/signup' || path === '/driver/signup' || path === '/rider/login';
}

export function isDriverSignupUrl(raw: string): boolean {
  try {
    const url = new URL(raw, 'https://citybucketlist.com');
    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'app.citybucketlist.com') return false;
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (path === '/driver/signup') return true;
    return path === '/rider/signup' && url.searchParams.get('intent') === 'driver';
  } catch {
    return false;
  }
}

export function storeOf(raw: string): 'apple' | 'google' | null {
  try {
    const host = new URL(raw, 'https://citybucketlist.com').hostname.replace(/^www\./, '');
    if (host === 'apps.apple.com' || host === 'itunes.apple.com') return 'apple';
    if (host === 'play.google.com') return 'google';
    return null;
  } catch {
    return null;
  }
}

function appleCampaignToken(touch: FirstTouch): string | null {
  const source = touch.utm_campaign || touch.utm_source;
  if (!source) return null;
  const token = source.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  return token || null;
}

function playReferrer(touch: FirstTouch): string | null {
  const params = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = touch[key];
    if (value) params.set(key, value);
  }
  const value = params.toString();
  return value || null;
}

/** Stamp a URL with the saved first touch when the destination can carry it. */
export function applyAttribution(raw: string, touch: FirstTouch | null, base = 'https://citybucketlist.com'): string {
  if (!touch) return raw;
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return raw;
  }
  const host = url.hostname.replace(/^www\./, '');
  let changed = false;

  if (host === 'play.google.com') {
    const referrer = playReferrer(touch);
    if (referrer && !url.searchParams.has('referrer')) {
      url.searchParams.set('referrer', referrer);
      changed = true;
    }
    return changed ? url.toString() : raw;
  }

  if (host === 'apps.apple.com' || host === 'itunes.apple.com') {
    const token = appleCampaignToken(touch);
    if (token && !url.searchParams.has('ct')) {
      url.searchParams.set('ct', token);
      changed = true;
    }
    return changed ? url.toString() : raw;
  }

  if (isSignupEntry(url)) {
    for (const key of UTM_KEYS) {
      const value = touch[key];
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
        changed = true;
      }
    }
    if (touch.referrer && !url.searchParams.has('signup_referrer')) {
      url.searchParams.set('signup_referrer', touch.referrer);
      changed = true;
    }
    if (touch.landing_path && !url.searchParams.has('signup_landing_path')) {
      url.searchParams.set('signup_landing_path', touch.landing_path);
      changed = true;
    }
    return changed ? url.toString() : raw;
  }

  return raw;
}

export function withAttribution(raw: string): string {
  return applyAttribution(raw, getFirstTouch());
}
