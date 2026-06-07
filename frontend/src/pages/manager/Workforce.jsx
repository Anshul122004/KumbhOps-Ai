import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  getEmergencyReadiness,
  getRoleDistribution,
  getWorkforceSummary,
  getZoneDistribution,
} from "../../services/workforceService";

const initialDashboard = {
  summary: null,
  zoneDistribution: [],
  roleDistribution: [],
  emergencyReadiness: null,
};

export function Workforce() {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard({ quiet = false } = {}) {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [summary, zoneDistribution, roleDistribution, emergencyReadiness] =
        await Promise.all([
          getWorkforceSummary(),
          getZoneDistribution(),
          getRoleDistribution(),
          getEmergencyReadiness(),
        ]);

      setDashboard({
        summary,
        zoneDistribution,
        roleDistribution,
        emergencyReadiness,
      });
    } catch (err) {
      setError(err.message || "Unable to load workforce dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return <PanelState message="Loading workforce deployment dashboard..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Workforce Deployment</p>
            <h2 className="mt-1 text-2xl font-semibold">Command Dashboard</h2>
          </div>
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => loadDashboard({ quiet: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Live deployment overview from volunteers, assignments, and emergency operations.
        </p>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Volunteers" value={dashboard.summary?.totalVolunteers ?? 0} />
        <StatCard label="Approved Volunteers" value={dashboard.summary?.approvedVolunteers ?? 0} />
        <StatCard label="Pending Volunteers" value={dashboard.summary?.pendingVolunteers ?? 0} />
        <StatCard label="Active Assignments" value={dashboard.summary?.activeAssignments ?? 0} />
        <StatCard label="Active Emergencies" value={dashboard.summary?.activeEmergencies ?? 0} />
        <StatCard
          label="Critical Emergencies"
          value={dashboard.summary?.criticalEmergencies ?? 0}
          urgent={Boolean(dashboard.summary?.criticalEmergencies)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DataPanel
          title="Zone Deployment"
          subtitle="Assigned workforce by operational zone"
          emptyTitle="No zone deployments yet"
          emptyText="Generate assignments to populate zone deployment analytics."
          isEmpty={dashboard.zoneDistribution.length === 0}
        >
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Zone Name</th>
                <th className="px-4 py-3 font-semibold">Assigned Volunteers</th>
                <th className="px-4 py-3 font-semibold">Active Assignments</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.zoneDistribution.map((zone) => (
                <tr key={zone.zone} className="border-b border-border last:border-0">
                  <td className="px-4 py-4 font-semibold">{zone.zone}</td>
                  <td className="px-4 py-4">{zone.assignedVolunteers}</td>
                  <td className="px-4 py-4">
                    <Badge variant={zone.activeAssignments ? "approved" : "neutral"}>
                      {zone.activeAssignments}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>

        <DataPanel
          title="Role Distribution"
          subtitle="Deployment volume by assigned role"
          emptyTitle="No assigned roles yet"
          emptyText="Roles will appear after AI assignments are generated."
          isEmpty={dashboard.roleDistribution.length === 0}
        >
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Assigned Count</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.roleDistribution.map((role) => (
                <tr key={role.role} className="border-b border-border last:border-0">
                  <td className="px-4 py-4 font-semibold">{role.role}</td>
                  <td className="px-4 py-4">
                    <Badge variant="info">{role.assignedCount}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Emergency Readiness</p>
            <h3 className="mt-1 text-xl font-semibold">Available Response Capacity</h3>
          </div>
          <Badge variant="neutral">assigned or active</Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReadinessCard
            label="Medical Responders Available"
            value={dashboard.emergencyReadiness?.medicalResponders ?? 0}
            variant="approved"
          />
          <ReadinessCard
            label="Crowd Management Responders Available"
            value={dashboard.emergencyReadiness?.crowdManagementResponders ?? 0}
            variant="pending"
          />
          <ReadinessCard
            label="Security Responders Available"
            value={dashboard.emergencyReadiness?.securityResponders ?? 0}
            variant="high"
          />
          <ReadinessCard
            label="General Operations Available"
            value={dashboard.emergencyReadiness?.generalOperations ?? 0}
            variant="info"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, urgent = false }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold">{value}</span>
        {urgent ? <Badge variant="rejected">attention</Badge> : null}
      </div>
    </section>
  );
}

function DataPanel({ title, subtitle, emptyTitle, emptyText, isEmpty, children }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="border-b border-border p-5">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {isEmpty ? (
        <div className="p-6">
          <h4 className="text-lg font-semibold">{emptyTitle}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </section>
  );
}

function ReadinessCard({ label, value, variant }) {
  return (
    <section className="rounded-md border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold">{value}</span>
        <Badge variant={variant}>{value ? "ready" : "gap"}</Badge>
      </div>
    </section>
  );
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </section>
  );
}
