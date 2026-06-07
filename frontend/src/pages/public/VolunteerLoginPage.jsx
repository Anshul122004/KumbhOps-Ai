import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";
import { LoginForm } from "../../components/auth/LoginForm";

export function VolunteerLoginPage() {
  return (
    <AuthCard
      eyebrow="Volunteer Login"
      title="Access your volunteer portal"
      description="Login with a volunteer account to view your dashboard, profile, tasks, and notifications."
      footer={
        <>
          New volunteer?{" "}
          <Link className="font-semibold text-primary" to="/volunteer/register">
            Register here
          </Link>
        </>
      }
    >
      <LoginForm role="volunteer" redirectTo="/volunteer/dashboard" />
    </AuthCard>
  );
}
