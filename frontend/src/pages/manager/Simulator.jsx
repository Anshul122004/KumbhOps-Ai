import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../hooks/useAuth";
import { UJJAIN_ZONES } from "../../lib/constants";
import {
  completeSimulation,
  formatScenarioType,
  getActiveSimulation,
  getSimulations,
  startSimulation,
} from "../../services/simulationService";

const scenarioTypes = ["medical", "crowd_surge", "fire", "security", "lost_person"];
const priorities = ["low", "medium", "high", "critical"];

const emptyForm = {
  scenario_type: "medical",
  zone: "Mahakal Lok",
  priority: "medium",
};

export function Simulator() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [simulations, setSimulations] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSimulations();
  }, []);

  async function loadSimulations() {
    setLoading(true);
    setError("");

    try {
      const [history, active] = await Promise.all([
        getSimulations(),
        getActiveSimulation(),
      ]);
      setSimulations(history);
      setActiveSimulation(active);
    } catch (err) {
      setError(err.message || "Simulation loading failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(event) {
    event.preventDefault();
    setStarting(true);
    setMessage("");
    setError("");

    try {
      const created = await startSimulation({
        ...form,
        managerId: user.id,
      });
      setActiveSimulation(created);
      setSimulations((current) => [created, ...current]);
      setMessage("Simulation started. Training drill is now visible to volunteers.");
    } catch (err) {
      setError(err.message || "Simulation creation failed.");
    } finally {
      setStarting(false);
    }
  }

  async function handleComplete() {
    if (!activeSimulation) return;

    setCompleting(true);
    setMessage("");
    setError("");

    try {
      const completed = await completeSimulation(activeSimulation.id);
      setActiveSimulation(null);
      setSimulations((current) =>
        current.map((simulation) =>
          simulation.id === completed.id ? completed : simulation,
        ),
      );
      setMessage("Simulation completed.");
    } catch (err) {
      setError(err.message || "Simulation completion failed.");
    } finally {
      setCompleting(false);
    }
  }

  const stats = getStats(simulations);

  if (loading) {
    return <PanelState message="Loading emergency simulation center..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Training Operations</p>
            <h2 className="mt-1 text-2xl font-semibold">Emergency Simulation Center</h2>
          </div>
          <Badge variant={activeSimulation ? "pending" : "neutral"}>
            {activeSimulation ? "running" : "standby"}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Active Simulations" value={stats.active} />
        <StatCard label="Completed Simulations" value={stats.completed} />
        <StatCard label="Medical Drills" value={stats.medical} />
        <StatCard label="Crowd Surge Drills" value={stats.crowd_surge} />
        <StatCard label="Fire Drills" value={stats.fire} />
        <StatCard label="Security Drills" value={stats.security} />
        <StatCard label="Lost Person Drills" value={stats.lost_person} />
      </div>

      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form className="grid gap-4 rounded-md border border-border bg-card p-5" onSubmit={handleStart}>
          <div>
            <p className="text-sm font-semibold text-primary">Start Drill</p>
            <h3 className="mt-1 text-xl font-semibold">Scenario Setup</h3>
          </div>

          <Field label="Scenario Type" id="scenario_type">
            <Select
              id="scenario_type"
              value={form.scenario_type}
              onChange={(event) =>
                setForm((current) => ({ ...current, scenario_type: event.target.value }))
              }
            >
              {scenarioTypes.map((type) => (
                <option key={type} value={type}>
                  {formatScenarioType(type)}
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

          <Button type="submit" disabled={starting}>
            {starting ? "Starting..." : "Start Simulation"}
          </Button>
        </form>

        <LiveSimulationPanel
          simulation={activeSimulation}
          completing={completing}
          onComplete={handleComplete}
        />
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border p-5">
          <h3 className="text-xl font-semibold">Simulation History</h3>
          <p className="mt-1 text-sm text-muted-foreground">Newest drills first.</p>
        </div>

        {simulations.length === 0 ? (
          <div className="p-6">
            <h4 className="text-lg font-semibold">No simulation history yet</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Start a drill to create the first training record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Scenario</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Started Time</th>
                  <th className="px-4 py-3 font-semibold">Completed Time</th>
                </tr>
              </thead>
              <tbody>
                {simulations.map((simulation) => (
                  <tr key={simulation.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 font-semibold">
                      {formatScenarioType(simulation.scenario_type)}
                    </td>
                    <td className="px-4 py-4">{simulation.zone}</td>
                    <td className="px-4 py-4">
                      <Badge variant={priorityTone(simulation.priority)}>{simulation.priority}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={simulation.status === "running" ? "pending" : "approved"}>
                        {simulation.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">{formatDate(simulation.started_at)}</td>
                    <td className="px-4 py-4">{formatDate(simulation.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function LiveSimulationPanel({ simulation, completing, onComplete }) {
  if (!simulation) {
    return (
      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-sm font-semibold text-primary">Live Simulation Panel</p>
        <h3 className="mt-1 text-xl font-semibold">No simulation running</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Start a scenario to broadcast a training drill to volunteers.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Simulation Running</p>
          <h3 className="mt-1 text-xl font-semibold">
            {formatScenarioType(simulation.scenario_type)}
          </h3>
        </div>
        <Badge variant="pending">running</Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Info label="Zone" value={simulation.zone} />
        <Info
          label="Priority"
          value={<Badge variant={priorityTone(simulation.priority)}>{simulation.priority}</Badge>}
        />
        <Info label="Status" value={simulation.status} />
        <Info label="Started" value={formatDate(simulation.started_at)} />
      </div>

      <div className="mt-5">
        <h4 className="font-semibold">Timeline</h4>
        <div className="mt-3 grid gap-2">
          {(simulation.timeline ?? []).map((step) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700">
                ✓
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={completing}
          onClick={onComplete}
        >
          {completing ? "Completing..." : "Complete Simulation"}
        </Button>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </section>
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

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium capitalize">{value}</div>
    </div>
  );
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
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
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStats(simulations) {
  return simulations.reduce(
    (stats, simulation) => {
      stats[simulation.status === "running" ? "active" : "completed"] += 1;
      stats[simulation.scenario_type] += 1;
      return stats;
    },
    {
      active: 0,
      completed: 0,
      medical: 0,
      crowd_surge: 0,
      fire: 0,
      security: 0,
      lost_person: 0,
    },
  );
}
