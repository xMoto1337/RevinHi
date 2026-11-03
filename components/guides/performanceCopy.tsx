import { getProduct } from "@/lib/products";

// Shared RevinHi Performance wording for its guide pages. Tweak names match the app
// (revinhi-performance/src/RevinHi.Core/Tweaks).
const PRICE = getProduct("performance").price;

export const PERFORMANCE_NOTE = <>Windows 10/11 &middot; {PRICE} once, no subscription &middot; every change can be undone</>;

export const PERFORMANCE_PITCH = `One-time ${PRICE}, free updates, no account. Every tweak saves the original setting first, Advanced tweaks need a Windows restore point, and Restore All Defaults puts everything back.`;

export const SAFETY_FAQ = {
  q: "Can these tweaks break my PC?",
  a: "RevinHi saves each setting's original value before it changes anything. Advanced-tier tweaks also need a Windows System Restore checkpoint first, and Restore All Defaults puts every change back exactly as it was.",
};
