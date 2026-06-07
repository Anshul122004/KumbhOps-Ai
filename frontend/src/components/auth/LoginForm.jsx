import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { loginWithRole } from "../../services/authService";

export function LoginForm({ role, redirectTo }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithRole({
        email: form.email,
        password: form.password,
        expectedRole: role,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-2">
        <Label htmlFor={`${role}-email`}>Email</Label>
        <Input
          id={`${role}-email`}
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <Input
          id={`${role}-password`}
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Checking access..." : "Login"}
      </Button>
    </form>
  );
}
