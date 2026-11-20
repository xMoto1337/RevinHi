import { PRODUCTS } from "@/lib/products";

// Shared by the feedback form (client) and /api/feedback (server).

export const FEEDBACK_KINDS = [
  { id: "idea", label: "Idea" },
  { id: "bug", label: "Bug" },
  { id: "other", label: "Other" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["id"];

/** Every app, plus the website itself and a catch-all. */
export const FEEDBACK_APPS: { id: string; label: string }[] = [
  ...PRODUCTS.map((p) => ({ id: p.slug, label: p.name })),
  { id: "website", label: "This website" },
  { id: "other", label: "Something else" },
];

export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 4000;
/** Forms sent faster than this after the page loaded are almost always bots. */
export const MIN_FILL_MS = 3000;
export const MAX_PER_HOUR = 5;
/** Alert emails per day (UTC), across everyone. Keeps feedback from eating the Resend free plan's
 *  100 emails/day that license-key emails also need. */
export const EMAILS_PER_DAY = 10;
