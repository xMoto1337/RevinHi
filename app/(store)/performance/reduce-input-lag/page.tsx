import type { Metadata } from "next";
import Link from "next/link";
import { PERFORMANCE_NOTE, PERFORMANCE_PITCH, SAFETY_FAQ } from "@/components/guides/performanceCopy";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { pageMetadata } from "@/lib/seo";

const SLUG = "reduce-input-lag";

export const metadata: Metadata = pageMetadata({
  title: "How to Reduce Input Lag on Windows 10 and 11 | RevinHi",
  description:
    "Make games feel snappier: Windows settings that cut input lag, like USB power saving, timer resolution and GPU scheduling, applied safely and undoably.",
  path: `/performance/${SLUG}`,
  image: "/brand/revinhi-perf.png",
  imageAlt: "RevinHi Performance app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="performance"
      guide={SLUG}
      eyebrow="Reduce input lag"
      title="How to reduce input lag on Windows"
      intro={
        <p>
          Input lag is the delay between moving your mouse or pressing a key and seeing it happen in the game. Some of it
          comes from Windows settings made for saving power or for everyday apps, not for games. Here are the settings
          that matter, and how RevinHi Performance changes them safely, with every change undoable.
        </p>
      }
      note={PERFORMANCE_NOTE}
      stepsTitle="How to cut input lag with RevinHi Performance"
      steps={[
        {
          title: "Start with the Safe tweaks",
          text: "Open Boost & Tweaks. In the Safe tier, turn on Disable USB Selective Suspend (stops your mouse and keyboard's USB ports from powering down and waking up mid-game), Windows Game Mode, Disable Game Bar / Game DVR, and the High Performance power plan.",
        },
        {
          title: "Try Disable Fullscreen Optimizations for older games",
          text: "This lets exclusive-fullscreen games skip the Windows desktop compositor. It mainly helps older DirectX 9 and 11 games; modern DirectX 12 games see little or no difference.",
        },
        {
          title: "Add the Advanced tweaks if you want more",
          text: "The Advanced tier includes 1ms Timer Resolution, Hardware-Accelerated GPU Scheduling (needs a reboot), MSI mode for GPU and network interrupts, and network tweaks like Disable Nagle's Algorithm. RevinHi asks for a Windows restore point before any Advanced tweak.",
        },
        {
          title: "Set NVIDIA's low latency mode",
          text: "If you have an NVIDIA card, Ultra Low Latency Mode shrinks the GPU's render queue. It lives in NVIDIA's own control panel, so RevinHi shows you where to switch it on.",
        },
        {
          title: "Play, compare, and undo anything",
          text: "Play a few rounds and see how it feels. Turn off any tweak you don't like, or press Restore All Defaults to put everything back the way it was before RevinHi.",
        },
      ]}
      faq={[
        {
          q: "Which settings help input lag the most?",
          a: "It depends on your PC and game. GPU-side settings like a low latency mode and Hardware-Accelerated GPU Scheduling, a 1ms timer resolution, and stopping USB power saving are common ones. Results vary, so try one change at a time and keep what helps.",
        },
        {
          q: "Will these tweaks lower my ping?",
          a: "No. Ping is the time to the game server and depends on your connection and distance. Some network tweaks can reduce delays on your own PC, but they don't shorten the trip to the server.",
        },
        {
          q: "What else helps besides Windows settings?",
          a: "Make sure your monitor runs at its highest refresh rate in Windows display settings, use a wired connection if you can, and keep your graphics driver up to date.",
        },
        SAFETY_FAQ,
        {
          q: "Do I need admin rights?",
          a: "Yes. RevinHi Performance runs as Administrator, because registry tweaks, network settings and power plans need it.",
        },
      ]}
      pitch={PERFORMANCE_PITCH}
    >
      <h2>Why Windows adds delay</h2>
      <p>
        Windows is tuned to balance power, background work and everyday apps. Features like USB power saving, a coarse
        system timer, background recording and power-saving CPU states are sensible for a laptop on battery, but they can
        add small delays when you&apos;re gaming. Each tweak in RevinHi Performance explains what it changes and what the
        trade-off is before you turn it on.
      </p>
      <p>
        Related: <Link href="/performance/increase-fps-windows">increase FPS on Windows</Link> and{" "}
        <Link href="/performance/best-dns-for-gaming">find the best DNS for gaming</Link>.
      </p>
    </ProductGuide>
  );
}
