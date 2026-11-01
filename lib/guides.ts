// Every "how to" guide page on the site, grouped by product. The sitemap, /guides, the site footer
// and each product's guide links read this list, so a new guide is added here plus its page file at
// app/(store)/<product route>/<slug>/page.tsx. See docs/SEO.md.

export type Guide = { product: string; slug: string; label: string; blurb: string };

export const GUIDES: Guide[] = [
  // RevinHi 3D (/3d/<slug>)
  { product: "3d", slug: "fix-broken-stl-files", label: "Fix broken STL files", blurb: "Open, cut and print STLs with holes or gaps." },
  { product: "3d", slug: "free-stl-editor", label: "Free STL editor for Windows", blurb: "Resize, cut, add text and print, free." },
  { product: "3d", slug: "picture-to-3d-model", label: "Picture to 3D model", blurb: "Offline AI on your own graphics card." },
  { product: "3d", slug: "add-text-to-stl", label: "Add text to an STL", blurb: "Raised or engraved, in any font on your PC." },
  { product: "3d", slug: "split-stl-to-fit-print-bed", label: "Split an STL to fit your bed", blurb: "Cut big models into parts with pegs." },
  { product: "3d", slug: "lithophane-maker", label: "Lithophane maker", blurb: "Flat or curved lithophanes from a photo." },
  { product: "3d", slug: "cut-hole-in-stl", label: "Cut a hole in an STL", blurb: "And combine STL files into one." },
  { product: "3d", slug: "tinkercad-alternative", label: "Offline Tinkercad alternative", blurb: "A desktop app with Solid and Hole shapes." },

  // RevinHi PDF (/pdf/<slug>)
  { product: "pdf", slug: "edit-pdf-text", label: "Edit PDF text", blurb: "Retype the words already in a PDF." },
  { product: "pdf", slug: "sign-pdf", label: "Sign a PDF", blurb: "Draw, type or upload a signature, offline." },
  { product: "pdf", slug: "merge-pdf", label: "Merge PDFs", blurb: "Combine files and put pages in order." },
  { product: "pdf", slug: "compress-pdf", label: "Compress a PDF", blurb: "Shrink big files without uploading them." },
  { product: "pdf", slug: "password-protect-pdf", label: "Password-protect a PDF", blurb: "Lock a PDF with AES-256, offline." },

  // RevinHi Recovery (/recovery/<slug>)
  { product: "recovery", slug: "recover-deleted-files", label: "Recover deleted files", blurb: "Get back files you deleted on Windows." },
  { product: "recovery", slug: "recover-emptied-recycle-bin", label: "Emptied the Recycle Bin?", blurb: "Bring back files after emptying it." },
  { product: "recovery", slug: "recover-formatted-drive", label: "Recover a formatted drive", blurb: "Files back after a quick format or RAW drive." },
  { product: "recovery", slug: "recover-sd-card-photos", label: "Recover photos from an SD card", blurb: "Camera and phone cards, even formatted." },
  { product: "recovery", slug: "recover-usb-flash-drive", label: "Recover files from a USB stick", blurb: "Deleted or formatted flash drives." },

  // RevinHi Performance (/performance/<slug>)
  { product: "performance", slug: "reduce-input-lag", label: "Reduce input lag on Windows", blurb: "Settings that make games feel snappier." },
  { product: "performance", slug: "increase-fps-windows", label: "Increase FPS on Windows", blurb: "Free up your PC for games, safely." },
  { product: "performance", slug: "best-dns-for-gaming", label: "Best DNS for gaming", blurb: "Test DNS speed on your own connection." },

  // RevinHi Desktop (/desktop/<slug>)
  { product: "desktop", slug: "live-wallpapers-windows", label: "Live wallpapers for Windows", blurb: "Animated scenes, videos and effects." },
  { product: "desktop", slug: "desktop-weather-radar", label: "Weather radar on your desktop", blurb: "Live US radar, lightning and alerts." },
];

export function guidesFor(product: string): Guide[] {
  return GUIDES.filter((g) => g.product === product);
}
