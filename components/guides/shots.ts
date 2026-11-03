import type { GuideImage } from "@/components/guides/HowToGuide";

/** RevinHi Recovery screenshots (from revinhi-recovery/store/listing/screenshots, 1600 px webp). */
export const RECOVERY_SHOTS = {
  drives: {
    src: "/recovery/screens/01-your-drives.webp",
    alt: "RevinHi Recovery's Your drives screen: internal drives, a USB stick and an SD card, each with a Scan button and its health",
    caption: "Every drive, USB stick and memory card on one screen, with its health.",
  },
  fullScan: {
    src: "/recovery/screens/02-full-scan.webp",
    alt: "A full scan of a 2 TB drive paused at 17%, with a map of the drive and the files found so far counted by type",
    caption: "A full scan searches the whole drive. Pause it any time; everything found so far is kept.",
  },
  finished: {
    src: "/recovery/screens/03-scan-finished.webp",
    alt: "A finished scan sorted into photos, videos, music, documents and archives",
    caption: "See what was found by type: photos, videos, music, documents and archives.",
  },
  preview: {
    src: "/recovery/screens/04-preview-before-saving.webp",
    alt: "Scan results in folders with deleted photos ticked, a photo preview, and a Good chance of recovery note",
    caption: "Preview each file and see its chance of recovery before you save it.",
  },
  folders: {
    src: "/recovery/screens/05-folders.webp",
    alt: "Scan results showing original folders, rebuilt folders and files found by their contents",
    caption: "Files with their original folders, rebuilt folders, and files found by their contents.",
  },
  search: {
    src: "/recovery/screens/06-search.webp",
    alt: "Searching a finished scan by name, type and size",
    caption: "Search the whole scan by name, type and size.",
  },
  partitions: {
    src: "/recovery/screens/09-lost-partitions.webp",
    alt: "Find lost partitions: a lost NTFS partition called Photos backup found on a USB stick, with a Scan button",
    caption: "Find partitions that went missing and scan them.",
  },
  tools: {
    src: "/recovery/screens/10-tools.webp",
    alt: "RevinHi Recovery's Tools: write image to drive, disk backup image, drive health and find lost partitions",
    caption: "Backup image, drive health, lost partitions and more, all in one place.",
  },
} satisfies Record<string, GuideImage>;

/** RevinHi Desktop frames rendered by the app's own scene engine (1280 x 720 jpg in /public/desktop). */
export const DESKTOP_SHOTS = {
  radar: {
    src: "/desktop/gallery/storm-radar.jpg",
    alt: "RevinHi Desktop's live storm radar widget on a Windows desktop",
    caption: "The live radar widget on the desktop.",
    width: 1280,
    height: 720,
  },
  weather: {
    src: "/desktop/gallery/weather-widgets.jpg",
    alt: "Weather widgets on a desktop: radar, forecast, current conditions and stats",
    caption: "Radar, forecast, conditions and stats widgets.",
    width: 1280,
    height: 720,
  },
  rain: {
    src: "/desktop/gallery/midnight-lofi.jpg",
    alt: "The Midnight Lo-fi scene with rain running down the screen",
    caption: "Midnight Lo-fi: rain on the glass.",
    width: 1280,
    height: 720,
  },
  aurora: {
    src: "/desktop/gallery/northern-lights.jpg",
    alt: "The Northern Lights live wallpaper with a rippling aurora",
    caption: "Northern Lights: a rippling aurora.",
    width: 1280,
    height: 720,
  },
  outrun: {
    src: "/desktop/gallery/outrun.jpg",
    alt: "The Outrun live wallpaper: a synthwave sun over a neon grid",
    caption: "Outrun: a synthwave sun and neon grid.",
    width: 1280,
    height: 720,
  },
  supercell: {
    src: "/desktop/gallery/supercell.jpg",
    alt: "The Supercell scene with a lightning storm effect",
    caption: "Supercell: a lightning storm effect.",
    width: 1280,
    height: 720,
  },
} satisfies Record<string, GuideImage>;
