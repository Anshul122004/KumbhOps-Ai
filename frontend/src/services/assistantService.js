import { supabase } from "../lib/supabase";
import { getAIInsightsDashboard } from "./aiInsightsService";

export async function answerOperationalQuestion(question) {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return "Ask a question about volunteers, assignments, emergencies, simulations, notifications, zone risks, or recommendations.";
  }

  if (matches(normalized, ["zone", "risk", "health", "support"])) {
    return answerZoneRisk();
  }

  if (matches(normalized, ["recommend", "suggest", "management do", "deployment suggestion"])) {
    return answerRecommendations();
  }

  if (matches(normalized, ["volunteer", "registered", "approved", "pending"])) {
    return answerVolunteerStats();
  }

  if (matches(normalized, ["assignment", "assignments", "role", "most volunteers"])) {
    return answerAssignmentStats();
  }

  if (matches(normalized, ["emergency", "emergencies", "incident", "incidents"])) {
    return answerEmergencyStats();
  }

  if (matches(normalized, ["simulation", "simulations", "drill", "drills"])) {
    return answerSimulationStats();
  }

  if (matches(normalized, ["notification", "notifications", "alerts sent"])) {
    return answerNotificationStats();
  }

  return [
    "I can answer operational questions about:",
    "",
    "- Volunteers",
    "- Assignments",
    "- Emergencies",
    "- Simulations",
    "- Notifications",
    "- Zone risks",
    "- Deployment recommendations",
    "",
    "Try: Which zone is most at risk?",
  ].join("\n");
}

async function answerVolunteerStats() {
  const { data, error } = await supabase.from("volunteers").select("status");
  if (error) throw error;

  const volunteers = data ?? [];
  return [
    `Total Volunteers: ${volunteers.length}`,
    `Approved: ${countByField(volunteers, "status", "approved")}`,
    `Pending: ${countByField(volunteers, "status", "pending")}`,
    `Rejected: ${countByField(volunteers, "status", "rejected")}`,
  ].join("\n");
}

async function answerAssignmentStats() {
  const { data, error } = await supabase
    .from("assignments")
    .select("assignment_status, assigned_role");
  if (error) throw error;

  const assignments = data ?? [];
  const roleCounts = groupCount(assignments, "assigned_role", "Unassigned Role");
  const topRole = roleCounts[0];

  return [
    `Assignments: ${assignments.length}`,
    `Active Assignments: ${countByField(assignments, "assignment_status", "active")}`,
    `Completed Assignments: ${countByField(assignments, "assignment_status", "completed")}`,
    "",
    "Most Common Role:",
    topRole ? `${topRole.label}: ${topRole.count}` : "No role assignments yet.",
  ].join("\n");
}

async function answerEmergencyStats() {
  const { data, error } = await supabase.from("emergencies").select("status, incident_type");
  if (error) throw error;

  const emergencies = data ?? [];
  const active = emergencies.filter((item) => item.status === "active");
  const incidentCounts = groupCount(active, "incident_type", "unknown");

  return [
    `Active Emergencies: ${active.length}`,
    "",
    ...formatCounts(incidentCounts),
  ].join("\n");
}

async function answerSimulationStats() {
  const { data, error } = await supabase.from("simulation_runs").select("status, scenario_type");
  if (error) throw error;

  const simulations = data ?? [];
  const completed = simulations.filter((item) => item.status === "completed");
  const scenarioCounts = groupCount(simulations, "scenario_type", "unknown");

  return [
    `Simulations Conducted: ${simulations.length}`,
    `Completed Drills: ${completed.length}`,
    "",
    ...formatCounts(scenarioCounts),
  ].join("\n");
}

async function answerNotificationStats() {
  const { data, error } = await supabase.from("notifications").select("type");
  if (error) throw error;

  const notifications = data ?? [];
  return [
    `Notifications Sent: ${notifications.length}`,
    "",
    `Announcements: ${countByField(notifications, "type", "announcement")}`,
    `Emergency Alerts: ${countByField(notifications, "type", "emergency")}`,
    `Assignments: ${countByField(notifications, "type", "assignment")}`,
    `Simulations: ${countByField(notifications, "type", "simulation")}`,
  ].join("\n");
}

async function answerZoneRisk() {
  const dashboard = await getAIInsightsDashboard();
  const zone = dashboard.zoneHealth[0];

  if (!zone) {
    return "No zone health data is available yet. Generate assignments or emergencies to calculate zone risk.";
  }

  const recommendation =
    dashboard.recommendations.find((item) => item.includes(zone.zone)) ||
    "Monitor coverage and maintain responder availability.";

  return [
    `Zone: ${zone.zone}`,
    `Risk: ${zone.riskLevel.toUpperCase()}`,
    `Health Score: ${zone.healthScore}/100`,
    "",
    "Reason:",
    `${zone.emergencyCount} active incident${zone.emergencyCount === 1 ? "" : "s"}, ${zone.assignedCount} assigned responder${zone.assignedCount === 1 ? "" : "s"}, ${zone.activeCount} active assignment${zone.activeCount === 1 ? "" : "s"}.`,
    "",
    "Recommendation:",
    recommendation,
  ].join("\n");
}

async function answerRecommendations() {
  const dashboard = await getAIInsightsDashboard();

  return dashboard.recommendations
    .map((recommendation, index) => `Recommendation ${index + 1}:\n${recommendation}`)
    .join("\n\n");
}

function matches(question, keywords) {
  return keywords.some((keyword) => question.includes(keyword));
}

function countByField(items, field, value) {
  return items.filter((item) => item[field] === value).length;
}

function groupCount(items, field, fallback) {
  const counts = new Map();
  for (const item of items) {
    const label = item[field] || fallback;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label: formatLabel(label), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function formatCounts(rows) {
  if (!rows.length) return ["No matching records."];
  return rows.map((row) => `${row.label}: ${row.count}`);
}

function formatLabel(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
