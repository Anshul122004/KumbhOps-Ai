import { supabase } from "../lib/supabase";

export async function generateVolunteerReport() {
  const { data, error } = await supabase.from("volunteers").select("*");
  if (error) throw error;

  const volunteers = data ?? [];
  return {
    total: volunteers.length,
    approved: countByField(volunteers, "status", "approved"),
    pending: countByField(volunteers, "status", "pending"),
    rejected: countByField(volunteers, "status", "rejected"),
    byZone: groupCount(volunteers, "preferred_zone", "Not selected"),
    bySkill: groupArrayCount(volunteers, "skills"),
    rows: volunteers.map((volunteer) => ({
      name: volunteer.full_name || "Unnamed volunteer",
      status: volunteer.status,
      preferred_zone: volunteer.preferred_zone || "Not selected",
      skills: (volunteer.skills ?? []).join("; "),
      experience_level: volunteer.experience_level || "Not selected",
      suitability_score: volunteer.suitability_score ?? "",
    })),
  };
}

export async function generateAssignmentReport() {
  const { data, error } = await supabase.from("assignments").select("*");
  if (error) throw error;

  const assignments = data ?? [];
  return {
    total: assignments.length,
    active: countByField(assignments, "assignment_status", "active"),
    completed: countByField(assignments, "assignment_status", "completed"),
    byRole: groupCount(assignments, "assigned_role", "Unassigned role"),
    byZone: groupCount(assignments, "assigned_zone", "Unassigned zone"),
    rows: assignments.map((assignment) => ({
      assigned_role: assignment.assigned_role || "Unassigned role",
      assigned_zone: assignment.assigned_zone || "Unassigned zone",
      assignment_status: assignment.assignment_status,
      assignment_reason: assignment.assignment_reason || "",
      created_at: assignment.created_at,
    })),
  };
}

export async function generateEmergencyReport() {
  const { data, error } = await supabase.from("emergencies").select("*");
  if (error) throw error;

  const emergencies = data ?? [];
  return {
    total: emergencies.length,
    active: countByField(emergencies, "status", "active"),
    resolved: countByField(emergencies, "status", "resolved"),
    byIncidentType: groupCount(emergencies, "incident_type", "unknown"),
    rows: emergencies.map((emergency) => ({
      title: emergency.title,
      incident_type: emergency.incident_type,
      zone: emergency.zone,
      priority: emergency.priority,
      status: emergency.status,
      created_at: emergency.created_at,
    })),
  };
}

export async function generateSimulationReport() {
  const { data, error } = await supabase.from("simulation_runs").select("*");
  if (error) throw error;

  const simulations = data ?? [];
  return {
    total: simulations.length,
    completed: countByField(simulations, "status", "completed"),
    byScenarioType: groupCount(simulations, "scenario_type", "unknown"),
    rows: simulations.map((simulation) => ({
      scenario_type: simulation.scenario_type,
      zone: simulation.zone,
      priority: simulation.priority,
      status: simulation.status,
      started_at: simulation.started_at,
      completed_at: simulation.completed_at || "",
    })),
  };
}

export async function generateNotificationReport() {
  const { data, error } = await supabase.from("notifications").select("*");
  if (error) throw error;

  const notifications = data ?? [];
  return {
    total: notifications.length,
    announcements: countByField(notifications, "type", "announcement"),
    emergencyAlerts: countByField(notifications, "type", "emergency"),
    assignmentNotifications: countByField(notifications, "type", "assignment"),
    simulationNotifications: countByField(notifications, "type", "simulation"),
    rows: notifications.map((notification) => ({
      title: notification.title,
      type: notification.type,
      zone: notification.zone || "All zones",
      is_read: notification.is_read ? "read" : "unread",
      created_at: notification.created_at,
    })),
  };
}

export async function generateExecutiveSummary() {
  const [
    volunteerReport,
    assignmentReport,
    emergencyReport,
    simulationReport,
    notificationReport,
  ] = await Promise.all([
    generateVolunteerReport(),
    generateAssignmentReport(),
    generateEmergencyReport(),
    generateSimulationReport(),
    generateNotificationReport(),
  ]);

  const coverageRatio = volunteerReport.approved
    ? assignmentReport.total / volunteerReport.approved
    : 0;
  const criticalRisk = emergencyReport.active >= 3;
  const readiness =
    coverageRatio >= 0.65 && emergencyReport.active <= 1
      ? "HIGH"
      : coverageRatio >= 0.35 && !criticalRisk
        ? "MODERATE"
        : "LOW";

  const summaryText = [
    `Operational readiness is ${readiness}.`,
    coverageRatio >= 0.65
      ? "Volunteer coverage is adequate across most zones."
      : "Volunteer coverage needs additional assignment activity.",
    emergencyReport.active
      ? `${emergencyReport.active} active emergency incident${emergencyReport.active === 1 ? "" : "s"} require monitoring.`
      : "No active emergency overloads detected.",
    simulationReport.completed
      ? `${simulationReport.completed} completed drill${simulationReport.completed === 1 ? "" : "s"} strengthen preparedness.`
      : "No completed drills are recorded yet.",
  ].join(" ");

  return {
    readiness,
    summaryText,
    rows: [
      { metric: "Readiness", value: readiness },
      { metric: "Total Volunteers", value: volunteerReport.total },
      { metric: "Approved Volunteers", value: volunteerReport.approved },
      { metric: "Total Assignments", value: assignmentReport.total },
      { metric: "Active Emergencies", value: emergencyReport.active },
      { metric: "Completed Simulations", value: simulationReport.completed },
      { metric: "Notifications Sent", value: notificationReport.total },
      { metric: "Summary", value: summaryText },
    ],
  };
}

export async function generateReportsDashboard() {
  const [
    volunteerReport,
    assignmentReport,
    emergencyReport,
    simulationReport,
    notificationReport,
    executiveSummary,
  ] = await Promise.all([
    generateVolunteerReport(),
    generateAssignmentReport(),
    generateEmergencyReport(),
    generateSimulationReport(),
    generateNotificationReport(),
    generateExecutiveSummary(),
  ]);

  return {
    volunteerReport,
    assignmentReport,
    emergencyReport,
    simulationReport,
    notificationReport,
    executiveSummary,
    stats: {
      totalVolunteers: volunteerReport.total,
      approvedVolunteers: volunteerReport.approved,
      totalAssignments: assignmentReport.total,
      activeEmergencies: emergencyReport.active,
      simulationsConducted: simulationReport.total,
      notificationsSent: notificationReport.total,
    },
  };
}

export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function escapeCsvValue(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

function countByField(items, field, value) {
  return items.filter((item) => item[field] === value).length;
}

function groupCount(items, field, fallback) {
  const grouped = new Map();
  for (const item of items) {
    const key = item[field] || fallback;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  return Array.from(grouped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function groupArrayCount(items, field) {
  const grouped = new Map();
  for (const item of items) {
    for (const value of item[field] ?? []) {
      grouped.set(value, (grouped.get(value) ?? 0) + 1);
    }
  }
  return Array.from(grouped.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
