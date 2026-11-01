// Shared RevinHi 3D wording, so a change to the free tier is made in ONE place.
// Used by the /3d guide pages (components/threed/*). Keep it in step with the export gate in
// revinhi-3d (src-tauri/src/gate.rs), the Store listing (revinhi-3d/store/LISTING.md) and the
// Free vs Pro table on /3d.

/** The one sentence that explains what Free and Pro save. */
export const FREE_VS_PRO_EXPORTS =
  "Every tool is free. Exports (STL, 3MF, OBJ, GLB and Send to slicer) are where Free and Pro differ: Free saves a lighter copy with up to 20,000 triangles (5,000 for AI-made models), coarser curves, and a small RevinHi mark engraved into the flat bottom. Pro saves every triangle with no mark.";

/** Shown under the Download free + Microsoft Store buttons. */
export const STORE_UPDATE_NOTE = "The Microsoft Store version updates through the Store.";
