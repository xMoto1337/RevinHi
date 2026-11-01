import type { Metadata } from "next";
import Link from "next/link";
import { PERFORMANCE_NOTE, PERFORMANCE_PITCH, SAFETY_FAQ } from "@/components/guides/performanceCopy";
import { ProductGuide } from "@/components/guides/ProductGuide";
import { pageMetadata } from "@/lib/seo";

const SLUG = "increase-fps-windows";

export const metadata: Metadata = pageMetadata({
  title: "How to Increase FPS on Windows 10 and 11 | RevinHi",
  description:
    "Free up your PC for games: pause background apps, trim startup programs, use Game Mode and the right power plan. Safe, reversible FPS tweaks for Windows.",
  path: `/performance/${SLUG}`,
  image: "/brand/revinhi-perf.png",
  imageAlt: "RevinHi Performance app icon",
});

export default function Page() {
  return (
    <ProductGuide
      product="performance"
      guide={SLUG}
      eyebrow="Increase FPS"
      title="How to increase FPS on Windows"
      intro={
        <p>
          Your graphics card sets the ceiling, but Windows can still get in the way: apps running in the background,
          programs that launch at startup, recording features and power saving. Clearing those out gives your game more
          of your PC. RevinHi Performance does it in a few clicks, and every change can be undone.
        </p>
      }
      note={PERFORMANCE_NOTE}
      stepsTitle="How to get more FPS with RevinHi Performance"
      steps={[
        {
          title: "See what your PC is doing",
          text: "The live dashboard shows CPU, GPU, RAM and ping in real time. If your GPU isn't near full use while you play, something else, often the CPU or background apps, is holding the game back.",
        },
        {
          title: "Pause background apps with Performance Boost",
          text: "Performance Boost suspends background apps that are using your RAM and CPU, with one click. Nothing is closed and no unsaved work is lost, and it's fully reversible.",
        },
        {
          title: "Turn on the Safe tweaks",
          text: "In Boost & Tweaks, turn on Windows Game Mode, Disable Game Bar / Game DVR (its background recording can cost CPU and GPU time and cause stutter) and the High Performance power plan, which keeps the CPU and GPU out of power-saving states.",
        },
        {
          title: "Trim what starts with Windows",
          text: "The Startup Manager shows exactly what launches when Windows boots. Switch off what you don't need, so it isn't running in the background while you play.",
        },
        {
          title: "Consider the Advanced tier",
          text: "Advanced tweaks, like Hardware-Accelerated GPU Scheduling, need a Windows restore point first. One of them, turning off Core Isolation (Memory Integrity), can help FPS on some games and PCs but lowers protection against malicious drivers, and the app says so plainly before you choose.",
        },
      ]}
      faq={[
        {
          q: "How much more FPS will I get?",
          a: "It depends on your PC, your game and what was running before. A PC with lots of background apps and startup programs usually gains the most. No setting can turn a slow graphics card into a fast one, so the dashboard helps you see where the limit is.",
        },
        {
          q: "Does Performance Boost close my apps?",
          a: "No. It suspends them, which pauses them in place, and you can resume them. Nothing is closed and no unsaved work is lost.",
        },
        SAFETY_FAQ,
        {
          q: "Is there a free version?",
          a: "No. RevinHi Performance is a one-time purchase with free updates and no account. If something isn't working for you, email support and refunds are handled case by case.",
        },
      ]}
      pitch={PERFORMANCE_PITCH}
    >
      <h2>FPS, stutter and frame pacing</h2>
      <p>
        A high average FPS can still feel rough if frames arrive unevenly. Background recording, apps waking up and power
        states switching can all cause stutter. Clearing background work helps both, and the{" "}
        <Link href="/performance/reduce-input-lag">input lag tweaks</Link> help games feel more responsive on top.
      </p>
      <p>
        Related: <Link href="/performance/best-dns-for-gaming">best DNS for gaming</Link>. See everything on the{" "}
        <Link href="/performance">RevinHi Performance</Link> page.
      </p>
    </ProductGuide>
  );
}
