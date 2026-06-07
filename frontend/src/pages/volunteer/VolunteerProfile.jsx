import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../hooks/useAuth";
import {
  EXPERIENCE_LEVELS,
  LANGUAGES,
  SKILLS,
  UJJAIN_ZONES,
} from "../../lib/constants";
import { getMyVolunteerProfile, saveMyVolunteerProfile } from "../../services/volunteerService";

const emptyProfile = {
  full_name: "",
  phone: "",
  age: "",
  gender: "",
  address: "",
  city: "",
  preferred_zone: "",
  skills: [],
  languages: [],
  experience_level: "",
  medical_training: false,
  crowd_control: false,
};

export function VolunteerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const data = await getMyVolunteerProfile(user?.id);
        if (!mounted) return;

        if (data) {
          setProfile({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            age: data.age ?? "",
            gender: data.gender ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            preferred_zone: data.preferred_zone ?? "",
            skills: data.skills ?? [],
            languages: data.languages ?? [],
            experience_level: data.experience_level ?? "",
            medical_training: Boolean(data.medical_training),
            crowd_control: Boolean(data.crowd_control),
          });
          setStatus(data.status ?? "pending");
        }
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function toggleArrayValue(field, value) {
    setProfile((current) => {
      const values = current[field];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [field]: nextValues };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const saved = await saveMyVolunteerProfile(user.id, profile);
      setStatus(saved.status);
      setMessage("Profile saved. Your approval status is ready for manager review.");
    } catch (err) {
      setError(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PanelState message="Loading volunteer profile..." />;
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Volunteer Onboarding</p>
            <h2 className="mt-1 text-2xl font-semibold">Profile Details</h2>
          </div>
          <Badge variant={status}>{status}</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Complete these details so managers can review and approve your volunteer deployment.
        </p>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert>{message}</Alert> : null}

      <section className="grid gap-4 rounded-md border border-border bg-card p-5 md:grid-cols-2">
        <Field label="Full Name" id="full_name">
          <Input
            id="full_name"
            required
            value={profile.full_name}
            onChange={(event) => updateField("full_name", event.target.value)}
          />
        </Field>
        <Field label="Phone" id="phone">
          <Input
            id="phone"
            required
            value={profile.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </Field>
        <Field label="Age" id="age">
          <Input
            id="age"
            min="16"
            type="number"
            value={profile.age}
            onChange={(event) => updateField("age", event.target.value)}
          />
        </Field>
        <Field label="Gender" id="gender">
          <Select
            id="gender"
            value={profile.gender}
            onChange={(event) => updateField("gender", event.target.value)}
          >
            <option value="">Select gender</option>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </Select>
        </Field>
        <Field label="Address" id="address">
          <Input
            id="address"
            value={profile.address}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </Field>
        <Field label="City" id="city">
          <Input
            id="city"
            value={profile.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </Field>
        <Field label="Preferred Zone" id="preferred_zone">
          <Select
            id="preferred_zone"
            required
            value={profile.preferred_zone}
            onChange={(event) => updateField("preferred_zone", event.target.value)}
          >
            <option value="">Select zone</option>
            {UJJAIN_ZONES.map((zone) => (
              <option key={zone}>{zone}</option>
            ))}
          </Select>
        </Field>
        <Field label="Experience Level" id="experience_level">
          <Select
            id="experience_level"
            required
            value={profile.experience_level}
            onChange={(event) => updateField("experience_level", event.target.value)}
          >
            <option value="">Select experience</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </Select>
        </Field>
      </section>

      <OptionSection
        title="Skills"
        options={SKILLS}
        selected={profile.skills}
        onToggle={(skill) => toggleArrayValue("skills", skill)}
      />

      <OptionSection
        title="Languages"
        options={LANGUAGES}
        selected={profile.languages}
        onToggle={(language) => toggleArrayValue("languages", language)}
      />

      <section className="grid gap-3 rounded-md border border-border bg-card p-5 md:grid-cols-2">
        <Checkbox
          label="Medical Training"
          checked={profile.medical_training}
          onChange={(checked) => updateField("medical_training", checked)}
        />
        <Checkbox
          label="Crowd Control Experience"
          checked={profile.crowd_control}
          onChange={(checked) => updateField("crowd_control", checked)}
        />
      </section>

      <div className="flex justify-end">
        <Button className="w-full sm:w-auto" type="submit" disabled={saving}>
          {saving ? "Saving profile..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, id, children }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Select({ className = "", ...props }) {
  return (
    <select
      className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
      {...props}
    />
  );
}

function OptionSection({ title, options, selected, onToggle }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <Checkbox
            key={option}
            label={option}
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
          />
        ))}
      </div>
    </section>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
      <input
        className="h-4 w-4 accent-primary"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </section>
  );
}
