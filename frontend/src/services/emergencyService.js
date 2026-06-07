import { supabase } from "../lib/supabase";
import { createNotification } from "./notificationService";

const responsePlans = {
  medical: [
    "Deploy nearest Medical Aid Volunteers",
    "Notify medical control room",
    "Clear surrounding crowd",
    "Escalate if required",
  ],
  lost_person: [
    "Notify help desk",
    "Broadcast missing person details",
    "Check nearby zones",
  ],
  crowd_surge: [
    "Deploy crowd management volunteers",
    "Open alternate routes",
    "Monitor density every 5 minutes",
  ],
  fire: [
    "Alert fire response team",
    "Evacuate nearby pilgrims",
    "Block affected route",
  ],
  security: [
    "Notify security control room",
    "Deploy security volunteers",
    "Restrict access temporarily",
  ],
};

const responderRoles = {
  medical: ["Medical Aid Volunteer", "Medical Support Volunteer"],
  lost_person: ["Help Desk Volunteer", "Pilgrim Guidance Volunteer", "General Operations Volunteer"],
  crowd_surge: ["Crowd Management Volunteer"],
  fire: ["Emergency Response Volunteer", "General Operations Volunteer"],
  security: ["Security Support Volunteer", "General Operations Volunteer"],
};

export async function listEmergencies() {
  const { data, error } = await supabase
    .from("emergencies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listActiveEmergencies() {
  const { data, error } = await supabase
    .from("emergencies")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createEmergency({ emergency, managerId }) {
  const generated = await generateEmergencyResponse(emergency);

  const { data, error } = await supabase
    .from("emergencies")
    .insert({
      title: emergency.title.trim(),
      incident_type: emergency.incident_type,
      zone: emergency.zone,
      priority: emergency.priority,
      description: emergency.description.trim(),
      response_plan: generated.response_plan,
      recommended_responder_count: generated.recommended_responder_count,
      created_by: managerId,
    })
    .select()
    .single();

  if (error) throw error;

  await createNotification(
    {
      title: `Emergency: ${data.title}`,
      message: `${formatIncidentType(data.incident_type)} reported at ${data.zone}. Priority: ${data.priority}.`,
      type: "emergency",
      recipient_role: "volunteer",
      zone: data.zone,
    },
    { broadcastToVolunteers: true },
  );

  return data;
}

export async function resolveEmergency(emergencyId) {
  const { data, error } = await supabase
    .from("emergencies")
    .update({ status: "resolved" })
    .eq("id", emergencyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function generateEmergencyResponse(emergency) {
  const planItems = responsePlans[emergency.incident_type] ?? responsePlans.security;
  const recommendedRoles = responderRoles[emergency.incident_type] ?? [];
  const recommended_responder_count = await countRecommendedResponders(recommendedRoles);

  return {
    response_plan: [
      `AI Response Plan for ${formatIncidentType(emergency.incident_type)} at ${emergency.zone}:`,
      ...planItems.map((item) => `- ${item}`),
      `Recommended responder count: ${recommended_responder_count}`,
    ].join("\n"),
    recommended_responder_count,
  };
}

async function countRecommendedResponders(roles) {
  if (!roles.length) return 0;

  const { data, error } = await supabase
    .from("assignments")
    .select("id, assigned_role, assignment_status")
    .in("assigned_role", roles)
    .in("assignment_status", ["assigned", "active"]);

  if (error) throw error;
  return data?.length ?? 0;
}

export function formatIncidentType(type) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
