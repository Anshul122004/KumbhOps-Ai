import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";
import { VolunteerRegistrationForm } from "../../components/auth/VolunteerRegistrationForm";

export function VolunteerRegisterPage() {
  return (
    <AuthCard
      eyebrow="Volunteer Registration"
      title="Join the operations team"
      description="Create a volunteer account for the KumbhOps AI demo. Your role will be set to volunteer automatically."
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-primary" to="/volunteer/login">
            Login as volunteer
          </Link>
        </>
      }
    >
      <VolunteerRegistrationForm />
    </AuthCard>
  );
}
