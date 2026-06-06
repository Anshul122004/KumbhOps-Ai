import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="text-sm font-semibold text-primary">KumbhOps AI</p>
      <h1 className="mt-2 text-3xl font-bold">Demo login</h1>
      <p className="mt-3 text-muted-foreground">
        Supabase Auth wiring is ready. Module 2 will add real volunteer registration and login forms.
      </p>
      <div className="mt-8 grid gap-3">
        <Link className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground" to="/volunteer/dashboard">
          Continue as Volunteer
        </Link>
        <Link className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold" to="/manager/dashboard">
          Continue as Manager
        </Link>
      </div>
    </section>
  );
}
