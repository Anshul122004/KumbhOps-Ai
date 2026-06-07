import { MapPinned, ShieldCheck, Sparkles, Users } from "lucide-react";

export function LandingPage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#020617]">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_10%,rgba(20,184,166,0.18),transparent_30rem),radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.14),transparent_32rem),linear-gradient(135deg,#020617_0%,#0F172A_52%,#1E3A8A_130%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Mahakumbh Innovation Hackathon</p>
            <h1 className="text-2xl font-bold">KumbhOps AI</h1>
          </div>
          <a className="relative z-20 rounded-md border border-border px-4 py-2 text-sm" href="/login">
            Login
          </a>
        </header>

        <div className="grid flex-1 items-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Volunteer deployment command center for Simhastha Kumbh.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Recruit, approve, allocate, monitor, and redeploy volunteers across Ujjain operational zones.
            </p>
            <div className="relative z-20 mt-8 flex flex-wrap gap-3">
              <a className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" href="/volunteer/register">
                Register Volunteer
              </a>
              <a className="rounded-md border border-border px-5 py-3 text-sm font-semibold" href="/volunteer/login">
                Volunteer Login
              </a>
              <a className="rounded-md border border-border px-5 py-3 text-sm font-semibold" href="/manager/login">
                Manager Login
              </a>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              ["Volunteer approval", Users],
              ["Zone allocation", MapPinned],
              ["Emergency response", ShieldCheck],
              ["AI recommendations", Sparkles],
            ].map(([label, Icon]) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
