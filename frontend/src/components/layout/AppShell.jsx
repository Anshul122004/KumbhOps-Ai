import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";

export function AppShell({ title, navItems }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card px-4 py-5 md:block">
        <Link to="/" className="block text-lg font-semibold tracking-normal">
          KumbhOps AI
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Simhastha workforce command</p>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground",
                    isActive && "bg-primary text-primary-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Module 1</p>
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
            <Link className="rounded-md border border-border px-3 py-2 text-sm" to="/">
              Home
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
