// The rider/driver app — booking, sign-up, and account flows all live here.
// CONVENTION: any <a> pointing at one of the external targets in this file
// (APP_URL, RIDER_BOOK_URL, DRIVER_SIGNUP_URL, DIRECTORY_APP_URL) must set
// target="_blank" rel="noopener noreferrer" — it keeps the marketing site open
// behind the app (retention) and prevents reverse-tabnabbing.
export const APP_URL = 'https://app.citybucketlist.com';

// "Become a Driver" acquisition CTAs.
//
// This used to point at the app's `/driver/signup` route, which creates a driver record
// and NO rider record. That contradicts how CBL actually works: everyone is a rider first
// and becomes a driver in addition, never instead. Three drivers ended up unable to book a
// ride as a passenger because the app did not consider them riders at all.
//
// `/rider/signup?intent=driver` is the same signup form riders use, and the app already
// honours that parameter: it creates the rider record and then sends them straight into
// the driver upgrade. Same destination for the prospect, one consistent account model
// behind it, and one referral path instead of two.
//
// Deliberately no ref on these three CTAs, and none should be added without checking
// first: the rider signup resolves referral codes through get_referrer_by_code, which
// understands drivers and riders but NOT partner or concierge codes, and silently treats a
// numeric code as a driver id.
export const DRIVER_SIGNUP_URL = `${APP_URL}/rider/signup?intent=driver`;

// Rider booking entry in the app (Justin's `/rider/login` route). Unlike the driver
// side, this one URL does it all: it auto-redirects an already-logged-in rider
// straight to /rider/dashboard, shows the login form for returning riders, and has a
// "Don't have an account? Sign up" link for new ones — i.e. "dashboard if logged-in,
// sign-in/up if logged-out." Use for "Book a Ride" CTAs.
export const RIDER_BOOK_URL = `${APP_URL}/rider/login`;

// Justin's standalone classifieds/business directory app — posting, featured
// upgrades, and sign-in already work there; the marketing site only renders
// a read-only preview of the same data (see lib/supabase/directoryClient.ts).
export const DIRECTORY_APP_URL = 'https://directory.citybucketlist.com/';

// Public teaser Buckee edge function (lives in the main-app Supabase project).
// Deployed by Justin per BUCKEE_HOMESCREEN_HANDOFF.md §3; override once it's live.
export const BUCKEE_PUBLIC_URL =
  import.meta.env.VITE_BUCKEE_PUBLIC_URL ||
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/buckee-public';

// Restaurant-partner Stripe Checkout (Supabase edge function in the main-app
// project). POST { plan: 'bronze'|'silver'|'gold' } → { url, mode }; redirect
// to url. Test mode until app_settings.stripe_live_payments_enabled = "true".
export const PARTNER_CHECKOUT_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/create-partner-checkout';

// Member payout onboarding (Stripe Connect Express) — how a member turns on
// cash payouts for referral commissions. Call with the member's access token
// as the Authorization bearer (apikey = anon key for the gateway).
export const MEMBER_CONNECT_ONBOARD_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/create-member-connect-account';
export const MEMBER_CONNECT_STATUS_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/check-member-connect-status';

// Anon key for the main-app Supabase project (public by design; RLS governs access —
// same key already shipped in ridesClient.ts). Used only to pass the functions gateway.
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';
