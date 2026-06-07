import { supabase } from "../lib/supabase";
import { getWorkforceSummary } from "./workforceService";

export async function getLiveCommandSnapshot() {
  const [emergencies, notifications, assignments, simulations, taskUpdates, summary] = await Promise.all([
    fetchTable("emergencies", "created_at"),
    fetchTable("notifications", "created_at"),
    fetchTable("assignments", "created_at"),
    fetchTable("simulation_runs", "started_at"),
    fetchTable("task_updates", "updated_at"),
    getWorkforceSummary(),
  ]);

  return {
    emergencies,
    notifications,
    assignments,
    simulations,
    taskUpdates,
    summary,
    timeline: buildOperationsTimeline({ emergencies, notifications, assignments, simulations, taskUpdates }),
  };
}

export function subscribeToLiveCommandCenter({ onChange, onStatus, onError }) {
  const channel = supabase
    .channel("live-command-center")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "emergencies" },
      (payload) => onChange("emergencies", payload),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      (payload) => onChange("notifications", payload),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "assignments" },
      (payload) => onChange("assignments", payload),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "simulation_runs" },
      (payload) => onChange("simulation_runs", payload),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "task_updates" },
      (payload) => onChange("task_updates", payload),
    )
    .subscribe((status, error) => {
      onStatus(status);
      if (error) onError(error);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export function buildOperationsTimeline({ emergencies, notifications, assignments, simulations, taskUpdates }) {
  const events = [
    ...(emergencies ?? []).map((item) => ({
      id: `emergency-${item.id}`,
      type: "emergency",
      title: `Emergency created: ${item.title}`,
      detail: `${formatLabel(item.incident_type)} at ${item.zone}`,
      createdAt: item.created_at,
    })),
    ...(notifications ?? []).map((item) => ({
      id: `notification-${item.id}`,
      type: "notification",
      title: `Notification sent: ${item.title}`,
      detail: item.zone ? `${item.type} for ${item.zone}` : item.type,
      createdAt: item.created_at,
    })),
    ...(assignments ?? []).map((item) => ({
      id: `assignment-${item.id}`,
      type: "assignment",
      title: `Assignment created: ${item.assigned_role || "Volunteer assignment"}`,
      detail: item.assigned_zone || "No zone",
      createdAt: item.created_at,
    })),
    ...(simulations ?? []).map((item) => ({
      id: `simulation-${item.id}`,
      type: "simulation",
      title:
        item.status === "completed"
          ? `Simulation completed: ${formatLabel(item.scenario_type)}`
          : `Simulation started: ${formatLabel(item.scenario_type)}`,
      detail: `${item.zone} (${item.priority})`,
      createdAt: item.completed_at || item.started_at,
    })),
    ...(taskUpdates ?? []).map((item) => ({
      id: `task-update-${item.id}`,
      type: "task",
      title: `Task update: ${formatLabel(item.status)}`,
      detail: item.notes || `Assignment ${item.assignment_id}`,
      createdAt: item.updated_at,
    })),
  ];

  return events
    .filter((event) => event.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
}

export function applyRealtimePayload(items, payload, sortColumn = "created_at") {
  if (payload.eventType === "DELETE") {
    return items.filter((item) => item.id !== payload.old.id);
  }

  const nextRecord = payload.new;
  const exists = items.some((item) => item.id === nextRecord.id);
  const nextItems = exists
    ? items.map((item) => (item.id === nextRecord.id ? nextRecord : item))
    : [nextRecord, ...items];

  return nextItems.sort((a, b) => new Date(b[sortColumn]) - new Date(a[sortColumn]));
}

async function fetchTable(table, orderColumn) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderColumn, { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

function formatLabel(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
