"use client";

import { useState } from "react";

const field =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-neon-cyan/60";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setCode("");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-panel space-y-4 rounded-2xl p-6">
      <h1 className="text-lg font-bold">Log in</h1>
      <div>
        <label htmlFor="adm-pass" className="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <input id="adm-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="adm-code" className="mb-1.5 block text-sm font-semibold">
          Code from your authenticator app
        </label>
        <input
          id="adm-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          placeholder="123 456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
          className={`${field} text-center text-lg tracking-[0.35em]`}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-neon-danger/40 bg-neon-danger/10 px-3.5 py-2.5 text-sm text-neon-danger">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-full border border-neon-cyan/40 bg-neon-cyan/15 px-6 py-2.5 text-sm font-semibold text-neon-cyan transition hover:bg-neon-cyan/25 hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] active:scale-[0.97] disabled:opacity-60"
      >
        {busy ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
