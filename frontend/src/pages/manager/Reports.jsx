import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  downloadCsv,
  generateReportsDashboard,
} from "../../services/reportService";

export function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports({ quiet = false } = {}) {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await generateReportsDashboard();
      setReports(data);
    } catch (err) {
      setError(err.message || "Unable to generate reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return <PanelState message="Generating reports..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Reports</p>
            <h2 className="mt-1 text-2xl font-semibold">Reports & Export Center</h2>
          </div>
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => loadReports({ quiet: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh Reports"}
          </Button>
        </div>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {reports ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Total Volunteers" value={reports.stats.totalVolunteers} />
            <StatCard label="Approved Volunteers" value={reports.stats.approvedVolunteers} />
            <StatCard label="Total Assignments" value={reports.stats.totalAssignments} />
            <StatCard label="Active Emergencies" value={reports.stats.activeEmergencies} />
            <StatCard label="Simulations Conducted" value={reports.stats.simulationsConducted} />
            <StatCard label="Notifications Sent" value={reports.stats.notificationsSent} />
          </div>

          <section className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Executive Summary</p>
                <h3 className="mt-1 text-xl font-semibold">
                  Operational Readiness: {reports.executiveSummary.readiness}
                </h3>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv("kumbhops-executive-summary.csv", reports.executiveSummary.rows)
                }
              >
                Export Executive Summary
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {reports.executiveSummary.summaryText}
            </p>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <ReportPanel
              title="Volunteer Report"
              actions={
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCsv("kumbhops-volunteer-report.csv", reports.volunteerReport.rows)
                  }
                >
                  Export Volunteer Report
                </Button>
              }
            >
              <SummaryGrid
                items={[
                  ["Total volunteers", reports.volunteerReport.total],
                  ["Approved", reports.volunteerReport.approved],
                  ["Pending", reports.volunteerReport.pending],
                  ["Rejected", reports.volunteerReport.rejected],
                ]}
              />
              <Distribution title="Breakdown by zone" rows={reports.volunteerReport.byZone} />
              <Distribution title="Breakdown by skills" rows={reports.volunteerReport.bySkill} />
            </ReportPanel>

            <ReportPanel
              title="Assignment Report"
              actions={
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCsv("kumbhops-assignment-report.csv", reports.assignmentReport.rows)
                  }
                >
                  Export Assignment Report
                </Button>
              }
            >
              <SummaryGrid
                items={[
                  ["Total assignments", reports.assignmentReport.total],
                  ["Active assignments", reports.assignmentReport.active],
                  ["Completed assignments", reports.assignmentReport.completed],
                ]}
              />
              <Distribution title="Role distribution" rows={reports.assignmentReport.byRole} />
              <Distribution title="Zone distribution" rows={reports.assignmentReport.byZone} />
            </ReportPanel>

            <ReportPanel
              title="Emergency Report"
              actions={
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadCsv("kumbhops-emergency-report.csv", reports.emergencyReport.rows)
                  }
                >
                  Export Emergency Report
                </Button>
              }
            >
              <SummaryGrid
                items={[
                  ["Total incidents", reports.emergencyReport.total],
                  ["Active incidents", reports.emergencyReport.active],
                  ["Resolved incidents", reports.emergencyReport.resolved],
                ]}
              />
              <Distribution
                title="Incident type distribution"
                rows={reports.emergencyReport.byIncidentType}
              />
            </ReportPanel>

            <ReportPanel title="Simulation Report">
              <SummaryGrid
                items={[
                  ["Total drills", reports.simulationReport.total],
                  ["Completed drills", reports.simulationReport.completed],
                ]}
              />
              <Distribution
                title="Scenario type breakdown"
                rows={reports.simulationReport.byScenarioType}
              />
            </ReportPanel>

            <ReportPanel title="Notification Report">
              <SummaryGrid
                items={[
                  ["Total notifications", reports.notificationReport.total],
                  ["Announcements", reports.notificationReport.announcements],
                  ["Emergency alerts", reports.notificationReport.emergencyAlerts],
                  ["Assignment notifications", reports.notificationReport.assignmentNotifications],
                  ["Simulation notifications", reports.notificationReport.simulationNotifications],
                ]}
              />
            </ReportPanel>
          </div>
        </>
      ) : (
        <EmptyState title="No reports generated" text="Refresh reports once Supabase data is available." />
      )}
    </div>
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

function ReportPanel({ title, actions, children }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {actions}
      </div>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

function SummaryGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
}

function Distribution({ title, rows }) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      {rows.length ? (
        <div className="mt-3 grid gap-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <span>{formatLabel(row.label)}</span>
              <Badge variant="info">{row.count}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No data available.</p>
      )}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <section className="rounded-md border border-border bg-card p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
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

function formatLabel(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
