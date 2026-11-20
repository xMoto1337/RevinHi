"use client";

import { useEffect, useRef, useState } from "react";
import { FEEDBACK_APPS, FEEDBACK_KINDS, type FeedbackKind, MESSAGE_MAX } from "@/lib/feedback";

const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-neon-cyan/60";

export function FeedbackForm({ initialApp = "" }: { initialApp?: string }) {
  const loadedAt = useRef(0);
  const [app, setApp] = useState(FEEDBACK_APPS.some((a) => a.id === initialApp) ? initialApp : "");
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  // Start the bot timer once the form is on screen.
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!app) return setError("Please pick which app this is about.");
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app, kind, message, email, website: trap, t: loadedAt.current, page: document.referrer || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="glass-panel mt-8 rounded-2xl p-6 text-center">
        <p className="text-lg font-bold text-neon-success">Thanks, we got it.</p>
        <p className="mt-2 text-sm text-white/60">
          {email ? "If we have a question we'll email you." : "Your message is on its way."}
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setState("idle");
            loadedAt.current = Date.now();
          }}
          className="mt-5 rounded-full border border-white/15 px-5 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white active:scale-[0.97]"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-panel mt-8 space-y-5 rounded-2xl p-5 sm:p-6" noValidate>
      <div>
        <label htmlFor="fb-app" className="mb-1.5 block text-sm font-semibold">
          Which app?
        </label>
        <select id="fb-app" value={app} onChange={(e) => setApp(e.target.value)} className={`${field} [&>option]:bg-[#111]`}>
          <option value="" disabled>
            Pick one
          </option>
          {FEEDBACK_APPS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-semibold">What kind?</legend>
        <div className="flex gap-2">
          {FEEDBACK_KINDS.map((k) => (
            <label
              key={k.id}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neon-cyan/60 ${
                kind === k.id
                  ? "border-neon-cyan/50 bg-neon-cyan/15 font-semibold text-neon-cyan"
                  : "border-white/15 text-white/65 hover:border-white/30 hover:text-white"
              }`}
            >
              <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="sr-only" />
              {k.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="fb-message" className="mb-1.5 block text-sm font-semibold">
          Your message
        </label>
        <textarea
          id="fb-message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={kind === "bug" ? "What happened, and what did you expect? Steps to make it happen again help a lot." : "Tell us your idea."}
          className={`${field} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-white/35">
          {message.length} / {MESSAGE_MAX}
        </p>
      </div>

      <div>
        <label htmlFor="fb-email" className="mb-1.5 block text-sm font-semibold">
          Your email <span className="font-normal text-white/40">(optional, only if you want a reply)</span>
        </label>
        <input
          id="fb-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={field}
        />
      </div>

      {/* Hidden from people; bots that fill every field get caught by it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="fb-website">Website</label>
        <input id="fb-website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-neon-danger/40 bg-neon-danger/10 px-3.5 py-2.5 text-sm text-neon-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-6 py-3 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/25 hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] active:scale-[0.97] disabled:opacity-60"
      >
        {state === "sending" ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
