/**
 * Platforms for the admin "Tracking links" card. Each link carries ?utm_source=<id>, and the
 * traffic API files those visits under `name` - the same name a plain referrer from that site
 * gets - so a platform shows up as one row in "Where visitors come from".
 */
export const PLATFORMS = [
  { id: "tiktok", name: "TikTok", medium: "social" },
  { id: "instagram", name: "Instagram", medium: "social" },
  { id: "facebook", name: "Facebook", medium: "social" },
  { id: "youtube", name: "YouTube", medium: "social" },
  { id: "x", name: "X / Twitter", medium: "social" },
  { id: "reddit", name: "Reddit", medium: "social" },
  { id: "discord", name: "Discord", medium: "social" },
  { id: "gumroad", name: "Gumroad", medium: "referral" },
  { id: "email", name: "Email", medium: "email" },
] as const;

/** utm_source id -> display name. */
export const UTM_NAMES: Record<string, string> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name]));
