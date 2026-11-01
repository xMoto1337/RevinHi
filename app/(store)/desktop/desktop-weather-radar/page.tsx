import type { Metadata } from "next";
import Link from "next/link";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { DESKTOP_SHOTS } from "@/components/guides/shots";
import { getProduct } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

const SLUG = "desktop-weather-radar";
const PRICE = getProduct("desktop").price;

export const metadata: Metadata = pageMetadata({
  title: "Live Weather Radar Widget for Your Desktop | RevinHi",
  description:
    "A live US weather radar on your Windows desktop, with lightning, severe-weather alerts and forecast widgets from NOAA and National Weather Service data.",
  path: `/desktop/${SLUG}`,
  image: "/brand/revinhi-desktop.png",
  imageAlt: "RevinHi Desktop app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="desktop"
      guide={SLUG}
      eyebrow="Weather radar on your desktop"
      title="Put a live weather radar on your desktop"
      intro={
        <p>
          Watch storms roll in without opening a browser. RevinHi Desktop puts a live US weather radar right on your
          Windows desktop, with lightning strikes, severe-weather alerts and forecast widgets, all from official NOAA and
          National Weather Service data.
        </p>
      }
      note={<>Windows 10/11 &middot; US weather data &middot; free version includes the radar</>}
      stepsTitle="How to add a radar widget to your desktop"
      steps={[
        {
          title: "Install RevinHi Desktop",
          text: "Download it free. The free version includes the live radar (latest scan) and severe-weather alerts for one location.",
        },
        {
          title: "Set your location",
          text: "Add your town so the radar, alerts and forecast are centered on you. Pro adds unlimited locations.",
        },
        {
          title: "Add the Radar widget",
          text: "Place the Radar widget on your desktop, then size it and set the zoom. Add Current Conditions, Forecast, Storm Alert, Temperature Graph or Sun & Moon widgets beside it.",
          image: DESKTOP_SHOTS.radar,
        },
        {
          title: "Turn on lightning and replay (Pro)",
          text: "Pro adds live lightning strikes, a 2-hour radar replay, sharper radar from individual radar towers and the full forecast.",
          image: DESKTOP_SHOTS.weather,
        },
      ]}
      faq={[
        {
          q: "Where does the weather data come from?",
          a: "Official NOAA and National Weather Service data. That covers the United States only, so the radar, lightning, alerts and forecast widgets work in the US.",
        },
        {
          q: "Does the rest of the app work outside the US?",
          a: "Yes. Wallpapers, widgets, rain and snow effects and presets work anywhere in the world. Only the weather features are US-only.",
        },
        {
          q: "Is the radar free?",
          a: `Yes. The free version shows the live radar (latest scan) and severe-weather alerts for one location, and never expires. Pro (${PRICE} once) adds live lightning, 2-hour replay, sharper tower radar, unlimited locations and the full forecast.`,
        },
        {
          q: "Will it slow down my PC?",
          a: "It's built to be lightweight, and you choose which widgets and effects run. Turn any of them off with one click.",
        },
      ]}
      pitch={`The radar and alerts are in the free version, which never expires. Pro is ${PRICE} once and adds live lightning, 2-hour replay, sharper radar, unlimited locations and every wallpaper and widget.`}
    >
      <h2>Weather widgets you can add</h2>
      <ul>
        <li>Radar, with zoom and animated recent scans</li>
        <li>Current conditions and forecast (daily bars, graph or list)</li>
        <li>Storm alert for severe-weather warnings</li>
        <li>Temperature graph and sun &amp; moon times</li>
      </ul>
      <p>
        Related: <Link href="/desktop/live-wallpapers-windows">live wallpapers for Windows</Link>. See everything on the{" "}
        <Link href="/desktop">RevinHi Desktop</Link> page.
      </p>
    </ProductGuide>
  );
}
