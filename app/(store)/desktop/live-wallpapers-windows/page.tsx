import type { Metadata } from "next";
import Link from "next/link";
import { GuideFigure } from "@/components/guides/HowToGuide";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { DESKTOP_SHOTS } from "@/components/guides/shots";
import { getProduct } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

const SLUG = "live-wallpapers-windows";
const PRICE = getProduct("desktop").price;

export const metadata: Metadata = pageMetadata({
  title: "Live Wallpapers for Windows 10 and 11 | RevinHi Desktop",
  description:
    "Set an animated live wallpaper on Windows: original scenes like auroras and synthwave, your own videos, widgets and rain on the glass. Free download.",
  path: `/desktop/${SLUG}`,
  image: "/brand/revinhi-desktop.png",
  imageAlt: "RevinHi Desktop app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="desktop"
      guide={SLUG}
      eyebrow="Live wallpapers for Windows"
      title="How to set a live wallpaper on Windows"
      intro={
        <p>
          Windows only does still pictures and slideshows on its own. RevinHi Desktop adds moving wallpapers: animated
          scenes like auroras, galaxies, synthwave sunsets and lava lamps, or your own videos and images, with widgets
          and rain or snow on top if you like.
        </p>
      }
      note={<>Windows 10/11 &middot; free forever &middot; Pro is {PRICE} once</>}
      stepsTitle="How to get a live wallpaper"
      steps={[
        {
          title: "Install RevinHi Desktop",
          text: "Download it free and run the installer. No account needed. The free version comes with an animated wallpaper, clock and date widgets.",
        },
        {
          title: "Pick a wallpaper",
          text: "Choose one of the animated scenes, like Northern Lights, Outrun, Lava Lamp or Firefly Meadow. With Pro you can also use any video or image of your own.",
          image: DESKTOP_SHOTS.aurora,
        },
        {
          title: "Add widgets",
          text: "Add a clock, date, system stats (CPU, RAM, GPU), battery, a calendar, a countdown, a to-do list or your own text, plus weather widgets. Change the font, color and size of each one.",
        },
        {
          title: "Turn on effects",
          text: "Add rain streaking down your screen, drifting snow or soft light rays over the desktop. Presets set a wallpaper, widgets and effects together in one click.",
          image: DESKTOP_SHOTS.rain,
        },
      ]}
      faq={[
        {
          q: "Will a live wallpaper slow down my games?",
          a: "RevinHi Desktop is built to stay light, and you choose exactly which wallpapers, widgets and effects run. Turn anything off with one click when you want every last frame.",
        },
        {
          q: "Can I use my own video as a wallpaper?",
          a: `Yes, with Pro (${PRICE} once). Pro unlocks every wallpaper plus your own videos and images, all widgets, the rain, snow and light effects, and the one-click presets.`,
        },
        {
          q: "What does the free version include?",
          a: "It never expires: an animated Gradient Flow wallpaper, clock and date widgets, and the live US weather radar and severe-weather alerts for one location. It shows a small Free badge and the occasional upgrade reminder.",
        },
        {
          q: "Does it work on Windows 10 and 11?",
          a: "Yes, both. It doesn't run on Mac, phones or tablets.",
        },
      ]}
      pitch={`The free version never expires. Pro is ${PRICE} once, with no subscription and free updates, and unlocks every wallpaper, your own videos, all widgets, effects and presets.`}
    >
      <h2>Scenes to try</h2>
      <p>Every frame below is rendered by the app itself.</p>
      <GuideFigure image={DESKTOP_SHOTS.outrun} />
      <GuideFigure image={DESKTOP_SHOTS.supercell} />
      <p>
        Related: <Link href="/desktop/desktop-weather-radar">put a live weather radar on your desktop</Link>. See every
        scene on the <Link href="/desktop">RevinHi Desktop</Link> page.
      </p>
    </ProductGuide>
  );
}
