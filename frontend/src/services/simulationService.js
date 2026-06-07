import { supabase } from "../lib/supabase";
import { createNotification } from "./notificationService";

const timelines = {
  medical: [
    "Incident Reported",
    "Medical Team Alerted",
    "Crowd Cleared",
    "Medical Team Arrived",
    "Patient Stabilized",
    "Incident Resolved",
  ],
  crowd_surge: [
    "Crowd Density Alert",
    "Response Team Dispatched",
    "Alternate Route Opened",
    "Flow Stabilized",
    "Incident Resolved",
  ],
  fire: [
    "Fire Alert Received",
    "Emergency Team Dispatched",
    "Area Evacuated",
    "Fire Controlled",
    "Incident Resolved",
  ],
  security: [
    "Security Breach Detected",
    "Security Team Alerted",
    "Restricted Area Secured",
    "Threat Neutralized",
    "Incident Resolved",
  ],
  lost_person: [
    "Missing Person Reported",
    "Help Desk Alerted",
    "Search Teams Dispatched",
    "Person Located",
    "Incident Resolved",
  ],
};

export async function startSimulation({ scenario_type, zone, priority, managerId }) {
  const timeline = generateSimulationTimeline(scenario_type);

  const { data, error } = await supabase
    .from("simulation_runs")
    .insert({
      scenario_type,
      zone,
      priority,
      timeline,
      status: "running",
      started_by: managerId,
    })
    .select()
    .single();

  if (error) throw error;

  await createNotification(
    {
      title: `Training Simulation: ${formatScenarioType(data.scenario_type)}`,
      message: `Training drill started at ${data.zone}. Priority: ${data.priority}. This is not a real incident.`,
      type: "simulation",
      recipient_role: "volunteer",
      zone: data.zone,
    },
    { broadcastToVolunteers: true },
  );

  return data;
}

export async function getSimulations() {
  const { data, error } = await supabase
    .from("simulation_runs")
    .select("*")
    .order("started_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveSimulation() {
  const { data, error } = await supabase
    .from("simulation_runs")
    .select("*")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function completeSimulation(simulationId) {
  const { data, error } = await supabase
    .from("simulation_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", simulationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function generateSimulationTimeline(scenarioType) {
  return timelines[scenarioType] ?? timelines.security;
}

export function formatScenarioType(type) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
