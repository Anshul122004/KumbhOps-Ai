import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../hooks/useAuth";
import { getMyAssignment } from "../../services/assignmentService";
import { formatIncidentType, listActiveEmergencies } from "../../services/emergencyService";
import { formatScenarioType, getActiveSimulation } from "../../services/simulationService";
import { getMyVolunteerProfile } from "../../services/volunteerService";

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const data = await getMyVolunteerProfile(user?.id);
        const [assignmentData, emergencyData, simulationData] = await Promise.all([
          data ? getMyAssignment(data.id) : null,
          listActiveEmergencies(),
          getActiveSimulation(),
        ]);
        if (mounted) {
          setProfile(data);
          setAssignment(assignmentData);
          setEmergencies(emergencyData);
          setActiveSimulation(simulationData);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load volunteer profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return <PanelState message="Loading volunteer dashboard..." />;
  }

  if (error) {
    return <PanelState message={error} />;
  }

  if (!profile) {
    return (
      <section className="rounded-md border border-border bg-card p-6">
        <p className="text-sm font-semibold text-primary">Profile Required</p>
        <h2 className="mt-2 text-2xl font-semibold">Complete your volunteer profile</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Managers can review and approve you after your onboarding details are saved.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          to="/volunteer/profile"
        >
          Open Profile
        </Link>
      </section>
    );
  }

  const currentAssignment = ["completed", "rejected"].includes(assignment?.assignment_status)
    ? null
    : assignment;

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Volunteer Dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold">{profile.full_name || "Volunteer"}</h2>
          </div>
          <Badge variant={profile.status}>{profile.status}</Badge>
        </div>
      </section>

      <section className="rounded-md border border-yellow-200 bg-yellow-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-yellow-800">Simulation Alerts</p>
            <h3 className="mt-1 text-xl font-semibold text-yellow-950">Training Exercise</h3>
          </div>
          <Badge variant={activeSimulation ? "pending" : "neutral"}>
            {activeSimulation ? "running" : "none"}
          </Badge>
        </div>

        {activeSimulation ? (
          <article className="mt-4 rounded-md border border-yellow-200 bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-yellow-700">
                  TRAINING SIMULATION - NOT A REAL INCIDENT
                </p>
                <h4 className="mt-1 text-lg font-semibold">
                  {formatScenarioType(activeSimulation.scenario_type)}
                </h4>
              </div>
              <Badge variant={priorityTone(activeSimulation.priority)}>
                {activeSimulation.priority}
              </Badge>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <p>
                <span className="font-semibold text-foreground">Scenario:</span>{" "}
                {formatScenarioType(activeSimulation.scenario_type)}
              </p>
              <p>
                <span className="font-semibold text-foreground">Zone:</span>{" "}
                {activeSimulation.zone}
              </p>
              <p>
                <span className="font-semibold text-foreground">Priority:</span>{" "}
                {activeSimulation.priority}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              {(activeSimulation.timeline ?? []).map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800">
                    ✓
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </article>
        ) : (
          <p className="mt-4 text-sm text-yellow-800">No active training simulation.</p>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Emergency Alerts</p>
            <h3 className="mt-1 text-xl font-semibold">Active Incidents</h3>
          </div>
          <Badge variant={emergencies.length ? "rejected" : "neutral"}>
            {emergencies.length} active
          </Badge>
        </div>

        {emergencies.length ? (
          <div className="mt-4 grid gap-3">
            {emergencies.map((emergency) => (
              <article
                key={emergency.id}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-lg font-semibold">{emergency.title}</h4>
                  <Badge variant={priorityTone(emergency.priority)}>{emergency.priority}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <p>
                    <span className="font-semibold text-foreground">Type:</span>{" "}
                    {formatIncidentType(emergency.incident_type)}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Zone:</span> {emergency.zone}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Responders:</span>{" "}
                    {emergency.recommended_responder_count ?? 0}
                  </p>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                  {emergency.response_plan || "Response plan pending."}
                </pre>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No active emergency alerts.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <DashboardCard
          label="Approval Status"
          value={<Badge variant={profile.status}>{profile.status}</Badge>}
        />
        <DashboardCard
          label="AI Score"
          value={<ScoreBadge score={profile.suitability_score} />}
        />
        <DashboardCard label="Preferred Zone" value={profile.preferred_zone || "Not selected"} />
        <DashboardCard label="Skills Count" value={profile.skills?.length ?? 0} />
        <DashboardCard label="Experience Level" value={profile.experience_level || "Not selected"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard label="Assigned Zone" value={currentAssignment?.assigned_zone || "Available"} />
        <DashboardCard label="Assigned Role" value={currentAssignment?.assigned_role || "Available"} />
        <DashboardCard
          label="Assignment Status"
          value={
            currentAssignment ? (
              <Badge variant={assignmentTone(currentAssignment.assignment_status)}>
                {currentAssignment.assignment_status}
              </Badge>
            ) : (
              "Available for Assignment"
            )
          }
        />
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Assignment Reason</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {currentAssignment?.assignment_reason ||
            "Assignment details will appear here after a manager generates your AI assignment."}
        </p>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Recommended Role</p>
        <h3 className="mt-2 text-xl font-semibold">
          {profile.recommended_role || "Complete profile to generate recommendation"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {profile.ai_reason || "AI suitability scoring will appear after saving your profile."}
        </p>
      </section>
    </div>
  );
}

function assignmentTone(status) {
  if (status === "completed") return "approved";
  if (status === "active") return "pending";
  return "neutral";
}

function priorityTone(priority) {
  if (priority === "critical") return "rejected";
  if (priority === "high") return "high";
  if (priority === "medium") return "pending";
  return "info";
}

function DashboardCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </section>
  );
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return <Badge variant="neutral">Not scored</Badge>;
  }

  const tone = score >= 75 ? "approved" : score >= 45 ? "pending" : "rejected";
  return <Badge variant={tone}>{score}/100</Badge>;
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </section>
  );
}
