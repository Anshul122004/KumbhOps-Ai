import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ allowedRoles, children }) {
  const { loading, session, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading KumbhOps AI...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && profile?.role && !allowedRoles.includes(profile.role)) {
    const fallbackPath = profile.role === "manager" ? "/manager/dashboard" : "/volunteer/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
