import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { pageMetadata } from "@/lib/seo";
import { FeedbackForm } from "./FeedbackForm";

export const metadata: Metadata = pageMetadata({
  title: "Send Feedback",
  description: "Send an idea for a RevinHi app, report a bug, or tell us anything else.",
  path: "/feedback",
  imageAlt: "RevinHi logo",
});

// ?app=<slug> comes from the "Send feedback" link on each app page and picks that app in the form.
export default async function FeedbackPage({ searchParams }: PageProps<"/feedback">) {
  const app = (await searchParams).app;
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Send feedback</h1>
        <p className="mt-3 text-white/60">
          Have an idea for an app, or found a bug? Tell us here. Every message is read.
        </p>
        <FeedbackForm initialApp={typeof app === "string" ? app : ""} />
      </main>
      <SiteFooter />
    </div>
  );
}
