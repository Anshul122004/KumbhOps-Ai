import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { getAIInsightsDashboard } from "../../services/aiInsightsService";

export function Insights() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights({ quiet = false } = {}) {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAIInsightsDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Unable to generate AI insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return <PanelState message="Generating predictive operations insights..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Predictive Operations</p>
            <h2 className="mt-1 text-2xl font-semibold">AI Insights Center</h2>
          </div>
          <Button
            variant="outline"
            disabled={refreshing}
            onClick={() => loadInsights({ quiet: true })}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Deterministic operational intelligence from volunteers, assignments, emergencies, and simulations.
        </p>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Operational Risk"
              value={dashboard.risk.label}
              detail={`${dashboard.risk.score}/100`}
              variant={riskTone(dashboard.risk.label)}
            />
            <MetricCard
              label="Readiness Score"
              value={`${dashboard.readiness.score}/100`}
              detail="Emergency posture"
              variant={dashboard.readiness.score >= 70 ? "approved" : dashboard.readiness.score >= 45 ? "pending" : "rejected"}
            />
            <MetricCard
              label="Active Emergencies"
              value={dashboard.activeEmergencies}
              detail="Live incidents"
              variant={dashboard.activeEmergencies ? "pending" : "neutral"}
            />
            <MetricCard
              label="Available Responders"
              value={dashboard.availableResponders}
              detail="Assigned or active"
              variant={dashboard.availableResponders ? "info" : "rejected"}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-md border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">AI Insights Panel</p>
                  <h3 className="mt-1 text-xl font-semibold">Operational Alerts</h3>
                </div>
                <Badge>{dashboard.alerts.length} insights</Badge>
              </div>

              <div className="mt-4 grid gap-3">
                {dashboard.alerts.map((alert) => (
                  <article
                    key={`${alert.title}-${alert.message}`}
                    className="rounded-md border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={alertTone(alert.severity)}>{alert.severity}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.message}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-md border border-border bg-card">
              <div className="border-b border-border p-5">
                <h3 className="text-xl font-semibold">Zone Health Table</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lower scoring zones need manager attention first.
                </p>
              </div>

              {dashboard.zoneHealth.length === 0 ? (
                <EmptyState
                  title="No zone data available"
                  text="Assignments and emergencies will populate zone health scoring."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Zone</th>
                        <th className="px-4 py-3 font-semibold">Health Score</th>
                        <th className="px-4 py-3 font-semibold">Risk Level</th>
                        <th className="px-4 py-3 font-semibold">Coverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.zoneHealth.map((zone) => (
                        <tr key={zone.zone} className="border-b border-border last:border-0">
                          <td className="px-4 py-4 font-semibold">{zone.zone}</td>
                          <td className="px-4 py-4">{zone.healthScore}/100</td>
                          <td className="px-4 py-4">
                            <Badge variant={riskTone(zone.riskLevel)}>{zone.riskLevel}</Badge>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {zone.assignedCount} assigned, {zone.activeCount} active
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Recommendations</p>
                <h3 className="mt-1 text-xl font-semibold">Suggested Actions</h3>
              </div>
              <Badge variant="info">{dashboard.recommendations.length} actions</Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dashboard.recommendations.map((recommendation) => (
                <article
                  key={recommendation}
                  className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted-foreground"
                >
                  {recommendation}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          title="No insights generated"
          text="Refresh the page once Supabase data is available."
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, detail, variant }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Badge variant={variant}>{detail}</Badge>
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </section>
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

function riskTone(level) {
  if (level === "High") return "rejected";
  if (level === "Medium") return "pending";
  return "approved";
}

function alertTone(severity) {
  if (severity === "critical") return "rejected";
  if (severity === "warning") return "pending";
  if (severity === "success") return "approved";
  return "info";
}
