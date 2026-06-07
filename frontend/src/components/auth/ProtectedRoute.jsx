import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ allowedRoles, children }) {
  const { loading, error, session, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading KumbhOps AI...
      </div>
    );
  }

  if (error) {
    return (
      <AccessState
        title="Unable to verify access"
        message={error.message || "Please check your Supabase configuration and try again."}
      />
    );
  }

  if (!session) {
    const loginPath = location.pathname.startsWith("/manager") ? "/manager/login" : "/volunteer/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <AccessState
        title="Profile not found"
        message="This authenticated account does not have a KumbhOps role profile yet."
      />
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile.role)) {
    const fallbackPath = profile.role === "manager" ? "/manager/dashboard" : "/volunteer/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

function AccessState({ title, message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="max-w-md rounded-md border border-border bg-card p-6 text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
      </section>
    </div>
  );
}
