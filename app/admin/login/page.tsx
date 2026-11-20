import { redirect } from "next/navigation";
import { adminLoginConfigured, isAdminSession } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  if (await isAdminSession()) redirect("/admin");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-sm font-bold tracking-[0.18em]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/revinhi-brand-64.png" alt="" width={32} height={32} />
          <span className="rgb-chase-text">REVINHI</span>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] text-white/55">ADMIN</span>
        </div>
        {adminLoginConfigured() ? (
          <LoginForm />
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-sm text-white/70">
            <p className="font-semibold text-white">Admin login isn&apos;t set up yet.</p>
            <p className="mt-2">
              Run <code className="text-neon-cyan">node scripts/admin-2fa-setup.mjs</code>, then add <code>ADMIN_TOTP_SECRET</code> to
              Vercel next to <code>ADMIN_SECRET</code>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
