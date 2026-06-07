import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <p className="text-sm font-semibold text-primary">KumbhOps AI</p>
      <h1 className="mt-2 text-3xl font-bold">Choose access</h1>
      <p className="mt-3 text-muted-foreground">
        Supabase Auth is enabled with role-based routing for volunteers and managers.
      </p>
      <div className="mt-8 grid gap-3">
        <Link className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground" to="/volunteer/login">
          Volunteer Login
        </Link>
        <Link className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold" to="/volunteer/register">
          Volunteer Registration
        </Link>
        <Link className="rounded-md border border-border px-4 py-3 text-center text-sm font-semibold" to="/manager/login">
          Manager Login
        </Link>
      </div>
    </section>
  );
}
