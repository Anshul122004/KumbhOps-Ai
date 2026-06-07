import { Link } from "react-router-dom";

export function AuthCard({ eyebrow, title, description, children, footer }) {
  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link to="/" className="mb-8 inline-flex items-center gap-3 text-sm font-semibold text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-black text-primary-foreground">
          KO
        </span>
        <span>KumbhOps AI</span>
      </Link>
      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </section>
  );
}
