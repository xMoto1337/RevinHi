// Shared RevinHi 3D wording, so a change to the free tier is made in ONE place.
// Used by the /3d guide pages (components/threed/*). Keep it in step with the export gate in
// revinhi-3d (src-tauri/src/gate.rs and free_saves.rs), the Store listing (revinhi-3d/store/LISTING.md) and the
// Free vs Pro table on /3d.

/** How many saves a new free user gets at full detail with no mark (revinhi-3d src-tauri/src/free_saves.rs). */
export const FULL_DETAIL_FREE_SAVES = 3;

/** The one sentence that explains what Free and Pro save. */
export const FREE_VS_PRO_EXPORTS =
  "Every tool is free, and your first 3 saves are full detail with no mark, so you can see the real quality. After that, exports (STL, 3MF, OBJ, GLB and Send to slicer) are where Free and Pro differ: Free saves a lighter copy with up to 20,000 triangles (5,000 for AI-made models), coarser curves, and a small RevinHi mark engraved into the flat bottom. Pro saves every triangle with no mark, always.";

/** Shown under the Download free + Microsoft Store buttons. */
export const STORE_UPDATE_NOTE = "The Microsoft Store version updates through the Store.";
