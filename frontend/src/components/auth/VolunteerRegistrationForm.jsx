import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { registerVolunteer } from "../../services/authService";

export function VolunteerRegistrationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerVolunteer(form);
      navigate("/volunteer/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to register volunteer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="volunteer-register-email">Email</Label>
        <Input
          id="volunteer-register-email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="volunteer-register-password">Password</Label>
        <Input
          id="volunteer-register-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Register as Volunteer"}
      </Button>
    </form>
  );
}
