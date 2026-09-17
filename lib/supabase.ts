import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service role key - every wallpaper API route runs server-side
 * (Next.js Route Handlers), so there's no browser exposure risk, and this sidesteps needing to
 * design Supabase RLS policies for what's currently a solo-admin-moderated marketplace. If a
 * browser-side client is ever needed (e.g. a client component doing its own fetch), that must use
 * the anon key instead - never ship the service role key to the client.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export const WALLPAPERS_BUCKET = "wallpapers";
export const THUMBNAILS_BUCKET = "wallpaper-thumbnails";
