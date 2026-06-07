import { UJJAIN_ZONES } from "../lib/constants";
import { supabase } from "../lib/supabase";

export async function getAIInsightsDashboard() {
  const [volunteersResult, assignmentsResult, emergenciesResult, simulationsResult] =
    await Promise.all([
      supabase.from("volunteers").select("*"),
      supabase.from("assignments").select("*"),
      supabase.from("emergencies").select("*"),
      supabase.from("simulation_runs").select("*"),
    ]);

  const error =
    volunteersResult.error ||
    assignmentsResult.error ||
    emergenciesResult.error ||
    simulationsResult.error;

  if (error) throw error;

  const data = {
    volunteers: volunteersResult.data ?? [],
    assignments: assignmentsResult.data ?? [],
    emergencies: emergenciesResult.data ?? [],
    simulations: simulationsResult.data ?? [],
  };

  const zoneHealth = generateZoneHealthScores(data);
  const readiness = generateEmergencyReadinessScore(data);
  const risk = generateWorkforceRiskAssessment(data, zoneHealth, readiness);
  const alerts = generateOperationalAlerts(data, zoneHealth, readiness);
  const recommendations = generateAIRecommendations(data, zoneHealth, readiness);

  return {
    risk,
    readiness,
    zoneHealth,
    alerts,
    recommendations,
    activeEmergencies: data.emergencies.filter((item) => item.status === "active").length,
    availableResponders: readiness.availableResponders,
  };
}

export function generateWorkforceRiskAssessment(data, zoneHealth, readiness) {
  const activeEmergencies = data.emergencies.filter((item) => item.status === "active");
  const criticalEmergencies = activeEmergencies.filter((item) => item.priority === "critical");
  const highRiskZones = zoneHealth.filter((zone) => zone.riskLevel === "High").length;
  const approvedVolunteers = data.volunteers.filter((item) => item.status === "approved").length;
  const assignedVolunteers = data.assignments.length;

  let score = 18;
  score += criticalEmergencies.length * 22;
  score += Math.max(activeEmergencies.length - 1, 0) * 12;
  score += highRiskZones * 8;

  if (approvedVolunteers && assignedVolunteers / approvedVolunteers < 0.45) {
    score += 14;
  }

  if (readiness.score < 50) {
    score += 16;
  }

  const riskScore = Math.min(score, 100);

  return {
    score: riskScore,
    label: riskScore >= 75 ? "High" : riskScore >= 45 ? "Medium" : "Low",
  };
}

export function generateZoneHealthScores(data) {
  return UJJAIN_ZONES.map((zone) => {
    const zoneAssignments = data.assignments.filter((item) => item.assigned_zone === zone);
    const activeAssignments = zoneAssignments.filter((item) => item.assignment_status === "active");
    const zoneEmergencies = data.emergencies.filter(
      (item) => item.zone === zone && item.status === "active",
    );
    const criticalEmergencies = zoneEmergencies.filter((item) => item.priority === "critical");

    let healthScore = 55;
    healthScore += Math.min(zoneAssignments.length * 7, 25);
    healthScore += Math.min(activeAssignments.length * 5, 15);
    healthScore -= zoneEmergencies.length * 18;
    healthScore -= criticalEmergencies.length * 18;

    const boundedScore = Math.max(0, Math.min(100, healthScore));

    return {
      zone,
      healthScore: boundedScore,
      riskLevel: boundedScore >= 75 ? "Low" : boundedScore >= 45 ? "Medium" : "High",
      assignedCount: zoneAssignments.length,
      activeCount: activeAssignments.length,
      emergencyCount: zoneEmergencies.length,
    };
  }).sort((a, b) => a.healthScore - b.healthScore);
}

export function generateEmergencyReadinessScore(data) {
  const availableAssignments = data.assignments.filter((item) =>
    ["assigned", "active"].includes(item.assignment_status),
  );
  const medical = countRole(availableAssignments, ["Medical Aid Volunteer", "Medical Support Volunteer"]);
  const crowd = countRole(availableAssignments, ["Crowd Management Volunteer"]);
  const security = countRole(availableAssignments, ["Security Support Volunteer"]);
  const general = countRole(availableAssignments, ["General Operations Volunteer", "Help Desk Volunteer"]);
  const activeEmergencies = data.emergencies.filter((item) => item.status === "active").length;

  let score = 35;
  score += Math.min(medical * 12, 24);
  score += Math.min(crowd * 10, 20);
  score += Math.min(security * 8, 16);
  score += Math.min(general * 4, 12);
  score -= activeEmergencies * 8;

  return {
    score: Math.max(0, Math.min(100, score)),
    availableResponders: medical + crowd + security + general,
    medical,
    crowd,
    security,
    general,
  };
}

export function generateAIRecommendations(data, zoneHealth, readiness) {
  const recommendations = [];
  const approved = data.volunteers.filter((item) => item.status === "approved").length;
  const unassignedApproved = Math.max(approved - data.assignments.length, 0);
  const weakZones = zoneHealth.filter((zone) => zone.riskLevel === "High").slice(0, 3);

  if (unassignedApproved > 0) {
    recommendations.push(`Deploy ${unassignedApproved} approved volunteer${unassignedApproved === 1 ? "" : "s"} from the unassigned pool.`);
  }

  for (const zone of weakZones) {
    recommendations.push(`Increase coverage at ${zone.zone}; health score is ${zone.healthScore}/100 with ${zone.emergencyCount} active incident${zone.emergencyCount === 1 ? "" : "s"}.`);
  }

  if (readiness.medical < 2) {
    recommendations.push("Add medical responders to improve emergency readiness for high-density zones.");
  }

  if (readiness.crowd < 2) {
    recommendations.push("Redistribute crowd management volunteers toward ghat and temple zones.");
  }

  if (!recommendations.length) {
    recommendations.push("Current deployment posture is stable. Keep monitoring emergency and simulation activity.");
  }

  return recommendations;
}

export function generateOperationalAlerts(data, zoneHealth, readiness) {
  const alerts = [];
  const activeEmergencies = data.emergencies.filter((item) => item.status === "active");
  const criticalEmergencies = activeEmergencies.filter((item) => item.priority === "critical");
  const runningSimulations = data.simulations.filter((item) => item.status === "running");
  const pendingVolunteers = data.volunteers.filter((item) => item.status === "pending").length;
  const highRiskZones = zoneHealth.filter((zone) => zone.riskLevel === "High");

  if (criticalEmergencies.length) {
    alerts.push({
      title: "Critical emergency load",
      message: `${criticalEmergencies.length} critical emergency incident${criticalEmergencies.length === 1 ? "" : "s"} active.`,
      severity: "critical",
    });
  }

  if (highRiskZones.length) {
    alerts.push({
      title: "Zone staffing risk",
      message: `${highRiskZones.length} zone${highRiskZones.length === 1 ? "" : "s"} need additional coverage.`,
      severity: "warning",
    });
  }

  if (readiness.score < 50) {
    alerts.push({
      title: "Emergency readiness below target",
      message: `Readiness score is ${readiness.score}/100. Add responders before peak demand.`,
      severity: "warning",
    });
  }

  if (pendingVolunteers >= 5) {
    alerts.push({
      title: "Approval queue buildup",
      message: `${pendingVolunteers} volunteers are pending review and could expand deployment capacity.`,
      severity: "info",
    });
  }

  if (runningSimulations.length) {
    alerts.push({
      title: "Training drill active",
      message: `${runningSimulations.length} simulation run${runningSimulations.length === 1 ? "" : "s"} currently active.`,
      severity: "info",
    });
  }

  if (!alerts.length) {
    alerts.push({
      title: "Operations stable",
      message: "No immediate staffing, emergency, or simulation alerts detected.",
      severity: "success",
    });
  }

  return alerts;
}

function countRole(assignments, roles) {
  return assignments.filter((assignment) => roles.includes(assignment.assigned_role)).length;
}
