import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

export function AppShell({ title, navItems }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-[#0F172A] px-4 py-5 shadow-2xl md:block">
        <SidebarContent navItems={navItems} onNavigate={() => {}} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close navigation backdrop"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            type="button"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] border-r border-border bg-[#0F172A] px-4 py-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">KumbhOps AI</span>
              <button
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
                type="button"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent navItems={navItems} onNavigate={() => setMobileOpen(false)} hideBrand />
          </aside>
        </div>
      ) : null}

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-[#0B1020]/85 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="Open navigation"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card hover:bg-muted md:hidden"
                type="button"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{profile?.email}</p>
                <p className="text-xs capitalize text-muted-foreground">{profile?.role}</p>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
                type="button"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="w-full max-w-[1920px] px-4 py-5 md:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navItems, onNavigate, hideBrand = false }) {
  return (
    <>
      {!hideBrand ? (
        <Link to="/" className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-teal-500/20">
            KO
          </span>
          <span className="text-lg font-semibold tracking-tight">KumbhOps AI</span>
        </Link>
      ) : null}

      <nav className={cn("space-y-1.5", hideBrand ? "mt-0" : "mt-7")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground",
                  isActive &&
                    "bg-primary/15 text-foreground shadow-[inset_3px_0_0_hsl(var(--primary))]",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 transition group-hover:text-primary" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
