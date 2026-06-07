import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  applyRealtimePayload,
  buildOperationsTimeline,
  getLiveCommandSnapshot,
  subscribeToLiveCommandCenter,
} from "../../services/realtimeService";
import { getWorkforceSummary } from "../../services/workforceService";

const initialLiveState = {
  emergencies: [],
  notifications: [],
  assignments: [],
  simulations: [],
  taskUpdates: [],
  timeline: [],
  summary: null,
};

export function LiveCommand() {
  const [liveState, setLiveState] = useState(initialLiveState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootLiveCenter() {
      setLoading(true);
      setError("");

      try {
        const snapshot = await getLiveCommandSnapshot();
        if (mounted) setLiveState(snapshot);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load live command data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootLiveCenter();

    const cleanup = subscribeToLiveCommandCenter({
      onStatus: (status) => {
        if (mounted) setConnectionStatus(status);
      },
      onError: (err) => {
        if (mounted) setError(err.message || "Realtime connection error.");
      },
      onChange: async (table, payload) => {
        setLiveState((current) => {
          const updates = {
            ...current,
            [tableNameToStateKey(table)]: applyRealtimePayload(
              current[tableNameToStateKey(table)],
              payload,
              getRealtimeSortColumn(table),
            ),
          };

          return {
            ...updates,
            timeline: buildOperationsTimeline(updates),
          };
        });

        try {
          const summary = await getWorkforceSummary();
          if (mounted) {
            setLiveState((current) => ({ ...current, summary }));
          }
        } catch (err) {
          if (mounted) setError(err.message || "Unable to refresh workforce summary.");
        }
      },
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const snapshot = await getLiveCommandSnapshot();
      setLiveState(snapshot);
    } catch (err) {
      setError(err.message || "Unable to refresh live command data.");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return <PanelState message="Connecting to Live Command Center..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Real-Time Operations</p>
            <h2 className="mt-1 text-2xl font-semibold">Live Command Center</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={connectionTone(connectionStatus)}>{connectionStatus}</Badge>
            <Button variant="outline" disabled={refreshing} onClick={handleRefresh}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Volunteers" value={liveState.summary?.totalVolunteers ?? 0} />
        <MetricCard label="Approved Volunteers" value={liveState.summary?.approvedVolunteers ?? 0} />
        <MetricCard label="Active Assignments" value={liveState.summary?.activeAssignments ?? 0} />
        <MetricCard
          label="Active Emergencies"
          value={liveState.summary?.activeEmergencies ?? 0}
          urgent={Boolean(liveState.summary?.activeEmergencies)}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <FeedPanel
          title="Live Emergency Feed"
          emptyTitle="No emergencies in feed"
          emptyText="New emergencies will appear here instantly."
        >
          {liveState.emergencies.length ? (
            liveState.emergencies.map((emergency) => (
              <article key={emergency.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">{emergency.title}</h3>
                  <Badge variant={priorityTone(emergency.priority)}>{emergency.priority}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatLabel(emergency.incident_type)} at {emergency.zone}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(emergency.created_at)}</p>
              </article>
            ))
          ) : null}
        </FeedPanel>

        <FeedPanel
          title="Live Notification Feed"
          emptyTitle="No notifications in feed"
          emptyText="New alerts and announcements will appear here instantly."
        >
          {liveState.notifications.length ? (
            liveState.notifications.map((notification) => (
              <article key={notification.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <Badge variant={notificationTone(notification.type)}>{notification.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
              </article>
            ))
          ) : null}
        </FeedPanel>
      </div>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Operations Timeline</p>
            <h3 className="mt-1 text-xl font-semibold">Latest Live Events</h3>
          </div>
          <Badge>{liveState.timeline.length} events</Badge>
        </div>

        {liveState.timeline.length ? (
          <div className="mt-4 grid gap-3">
            {liveState.timeline.map((event) => (
              <article key={event.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={timelineTone(event.type)}>{event.type}</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No operations timeline yet"
            text="Emergency, assignment, notification, and simulation events will appear here."
          />
        )}
      </section>
    </div>
  );
}

function FeedPanel({ title, emptyTitle, emptyText, children }) {
  const hasChildren = Boolean(children);

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto pr-1">
        {hasChildren ? children : <EmptyState title={emptyTitle} text={emptyText} />}
      </div>
    </section>
  );
}

function MetricCard({ label, value, urgent = false }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-semibold">{value}</span>
        {urgent ? <Badge variant="rejected">live</Badge> : null}
      </div>
    </section>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
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

function tableNameToStateKey(table) {
  if (table === "simulation_runs") return "simulations";
  if (table === "task_updates") return "taskUpdates";
  return table;
}

function getRealtimeSortColumn(table) {
  if (table === "simulation_runs") return "started_at";
  if (table === "task_updates") return "updated_at";
  return "created_at";
}

function connectionTone(status) {
  if (status === "SUBSCRIBED") return "approved";
  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") return "rejected";
  return "pending";
}

function priorityTone(priority) {
  if (priority === "critical") return "rejected";
  if (priority === "high") return "high";
  if (priority === "medium") return "pending";
  return "info";
}

function notificationTone(type) {
  if (type === "emergency") return "rejected";
  if (type === "simulation") return "pending";
  if (type === "assignment") return "info";
  if (type === "approval") return "approved";
  return "neutral";
}

function timelineTone(type) {
  if (type === "emergency") return "rejected";
  if (type === "simulation") return "pending";
  if (type === "assignment") return "info";
  if (type === "task") return "approved";
  return "neutral";
}

function formatLabel(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
