import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { UJJAIN_ZONES } from "../../lib/constants";
import {
  createEmergency,
  formatIncidentType,
  listEmergencies,
  resolveEmergency,
} from "../../services/emergencyService";

const incidentTypes = ["medical", "lost_person", "crowd_surge", "fire", "security"];
const priorities = ["low", "medium", "high", "critical"];

const emptyForm = {
  title: "",
  incident_type: "medical",
  zone: "Mahakal Lok",
  priority: "medium",
  description: "",
};

export function Emergency() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [emergencies, setEmergencies] = useState([]);
  const [expandedId, setExpandedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resolvingId, setResolvingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadEmergencies();
  }, []);

  async function loadEmergencies() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      }= await supabase.auth.getUser();

      console.log("AUTH USER:", user);
      console.log("AUTH USER ID:", user?.id);
      console.log("AUTH USER EMAIL:", user?.email);

      const data = await listEmergencies();

      console.log("EMERGENCIES:", data);

      setEmergencies(data);
    } catch (err) {
      console.error("EMERGENCY ERROR:", err);
      console.error("EMERGENCY ERROR JSON:", JSON.stringify(err, null, 2));
      setError(err.message || "Unable to load emergencies.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const created = await createEmergency({ emergency: form, managerId: user.id });
      setEmergencies((current) => [created, ...current]);
      setForm(emptyForm);
      setMessage("Emergency created and AI response plan generated.");
      setExpandedId(created.id);
    } catch (err) {
      setError(err.message || "Unable to create emergency.");
    } finally {
      setCreating(false);
    }
  }

  async function handleResolve(emergencyId) {
    setResolvingId(emergencyId);
    setError("");
    setMessage("");

    try {
      const updated = await resolveEmergency(emergencyId);
      setEmergencies((current) =>
        current.map((emergency) => (emergency.id === emergencyId ? updated : emergency)),
      );
      setMessage("Emergency marked as resolved.");
    } catch (err) {
      setError(err.message || "Unable to resolve emergency.");
    } finally {
      setResolvingId("");
    }
  }

  const activeCount = emergencies.filter((item) => item.status === "active").length;
  const criticalCount = emergencies.filter(
    (item) => item.status === "active" && item.priority === "critical",
  ).length;
  const resolvedCount = emergencies.filter((item) => item.status === "resolved").length;

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Emergency Response</p>
            <h2 className="mt-1 text-2xl font-semibold">Command Center</h2>
          </div>
          <Badge variant={criticalCount ? "rejected" : "neutral"}>{criticalCount} critical</Badge>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Active Emergencies" value={activeCount} />
        <StatCard label="Critical Emergencies" value={criticalCount} />
        <StatCard label="Resolved Emergencies" value={resolvedCount} />
      </div>

      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form className="grid gap-4 rounded-md border border-border bg-card p-5" onSubmit={handleCreate}>
        <div>
          <p className="text-sm font-semibold text-primary">Create Emergency</p>
          <h3 className="mt-1 text-xl font-semibold">Incident Intake</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" id="title">
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </Field>

          <Field label="Incident Type" id="incident_type">
            <Select
              id="incident_type"
              value={form.incident_type}
              onChange={(event) =>
                setForm((current) => ({ ...current, incident_type: event.target.value }))
              }
            >
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {formatIncidentType(type)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Zone" id="zone">
            <Select
              id="zone"
              value={form.zone}
              onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
            >
              {UJJAIN_ZONES.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </Select>
          </Field>

          <Field label="Priority" id="priority">
            <Select
              id="priority"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value }))
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" id="description">
          <textarea
            id="description"
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Emergency"}
          </Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading emergencies...</div>
        ) : emergencies.length === 0 ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold">No emergencies recorded</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an incident to generate the first AI response plan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Incident Type</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created Time</th>
                  <th className="px-4 py-3 font-semibold">Responders</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((emergency) => (
                  <EmergencyRow
                    key={emergency.id}
                    emergency={emergency}
                    expanded={expandedId === emergency.id}
                    resolving={resolvingId === emergency.id}
                    onToggle={() =>
                      setExpandedId((current) => (current === emergency.id ? "" : emergency.id))
                    }
                    onResolve={() => handleResolve(emergency.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function EmergencyRow({ emergency, expanded, resolving, onToggle, onResolve }) {
  return (
    <>
      <tr className="border-b border-border">
        <td className="px-4 py-4 align-top font-semibold">{emergency.title}</td>
        <td className="px-4 py-4 align-top">{formatIncidentType(emergency.incident_type)}</td>
        <td className="px-4 py-4 align-top">{emergency.zone}</td>
        <td className="px-4 py-4 align-top">
          <Badge variant={priorityTone(emergency.priority)}>{emergency.priority}</Badge>
        </td>
        <td className="px-4 py-4 align-top">
          <Badge variant={emergency.status === "active" ? "pending" : "approved"}>
            {emergency.status}
          </Badge>
        </td>
        <td className="px-4 py-4 align-top">{formatDate(emergency.created_at)}</td>
        <td className="px-4 py-4 align-top">{emergency.recommended_responder_count ?? 0}</td>
        <td className="px-4 py-4 align-top">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onToggle}>
              {expanded ? "Hide Plan" : "View Response Plan"}
            </Button>
            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={emergency.status === "resolved" || resolving}
              onClick={onResolve}
            >
              {resolving ? "Resolving..." : "Resolve"}
            </Button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-border bg-muted/30">
          <td className="px-4 py-4" colSpan={8}>
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
              {emergency.response_plan || "No response plan generated."}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
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
      className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm capitalize outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
      {...props}
    />
  );
}

function StatCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </section>
  );
}

function priorityTone(priority) {
  if (priority === "critical") return "rejected";
  if (priority === "high") return "high";
  if (priority === "medium") return "pending";
  return "info";
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
