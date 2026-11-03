import { getProduct } from "@/lib/products";

// Shared RevinHi Recovery wording for its guide pages. Keep in step with /recovery and
// revinhi-recovery/store/LISTING.md (what's free and what Pro does).
const PRICE = getProduct("recovery").price;

export const RECOVERY_NOTE = <>Windows 10/11 &middot; free scan and preview &middot; Pro is {PRICE} once</>;

export const RECOVERY_PITCH = `Scanning and previews are free, so you see exactly what can come back before you pay. Pro (${PRICE} once, no subscription, free updates) saves the files.`;

export const RECOVERY_FREE_FAQ = {
  q: "Is it free?",
  a: `Scanning, previews, search and the drive tools are free. Saving the files a scan finds needs Pro, a one-time ${PRICE} with free updates: no subscription and no account.`,
};

export const STOP_USING_FAQ = {
  q: "What should I do first?",
  a: "Stop using the drive. Don't save, install or download anything to it, because new files can be written over the ones you lost. If you can, install RevinHi Recovery on a different drive, and always save what you recover to a different drive.",
};
