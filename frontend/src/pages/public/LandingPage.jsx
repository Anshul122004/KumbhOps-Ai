import { Link } from "react-router-dom";
import { MapPinned, ShieldCheck, Sparkles, Users } from "lucide-react";

export function LandingPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Mahakumbh Innovation Hackathon</p>
          <h1 className="text-2xl font-bold">KumbhOps AI</h1>
        </div>
        <Link className="rounded-md border border-border px-4 py-2 text-sm" to="/login">
          Login
        </Link>
      </header>

      <div className="grid flex-1 items-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Volunteer deployment command center for Simhastha Kumbh.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Recruit, approve, allocate, monitor, and redeploy volunteers across Ujjain operational zones.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" to="/login">
              Enter Demo
            </Link>
            <Link className="rounded-md border border-border px-5 py-3 text-sm font-semibold" to="/manager/dashboard">
              Manager Portal
            </Link>
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
    </section>
  );
}
