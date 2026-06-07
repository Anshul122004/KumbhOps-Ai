import { AuthCard } from "../../components/auth/AuthCard";
import { LoginForm } from "../../components/auth/LoginForm";

export function ManagerLoginPage() {
  return (
    <AuthCard
      eyebrow="Manager Login"
      title="Open command access"
      description="Login with a manager account to access dashboard, review, assignment, workforce, emergency, and simulator tools."
    >
      <LoginForm role="manager" redirectTo="/manager/dashboard" />
    </AuthCard>
  );
}
