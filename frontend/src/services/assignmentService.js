import { supabase } from "../lib/supabase";
import { createNotification } from "./notificationService";

const OPEN_ASSIGNMENT_STATUSES = ["assigned", "active"];

export const ASSIGNMENT_ROLES = [
  "Medical Aid Volunteer",
  "Crowd Management Volunteer",
  "Security Support Volunteer",
  "Help Desk Volunteer",
  "Pilgrim Guidance Volunteer",
  "Transport Support Volunteer",
  "Food Distribution Volunteer",
  "General Operations Volunteer",
];

export function generateAssignment(volunteer) {
  const assigned_role = selectAssignedRole(volunteer);
  const assigned_zone = volunteer.preferred_zone || "Central Command";
  const priority = selectPriority(volunteer.suitability_score ?? 0);
  const assignment_reason = buildAssignmentReason({
    volunteer,
    assigned_role,
    assigned_zone,
    priority,
  });

  return {
    assigned_role,
    assigned_zone,
    assignment_reason,
  };
}

export async function listApprovedVolunteersWithAssignments() {
  const [
    { data: volunteers, error: volunteerError },
    { data: assignments, error: assignmentError },
    { data: terminalUpdates, error: updateError },
  ] =
    await Promise.all([
      supabase
        .from("volunteers")
        .select("*")
        .eq("status", "approved")
        .order("suitability_score", { ascending: false, nullsFirst: false }),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("task_updates")
        .select("assignment_id, status, notes, updated_at")
        .in("status", ["completed", "rejected"])
        .order("updated_at", { ascending: false }),
    ]);

  if (volunteerError) throw volunteerError;
  if (assignmentError) throw assignmentError;
  if (updateError) throw updateError;

  const latestAssignmentByVolunteerId = new Map();
  const openAssignmentByVolunteerId = new Map();
  const latestCompletedAssignmentByVolunteerId = new Map();
  const latestRejectedAssignmentByVolunteerId = new Map();
  const completedUpdateByAssignmentId = new Map();
  const rejectedUpdateByAssignmentId = new Map();

  for (const update of terminalUpdates ?? []) {
    if (update.status === "completed" && !completedUpdateByAssignmentId.has(update.assignment_id)) {
      completedUpdateByAssignmentId.set(update.assignment_id, update);
    }
    if (update.status === "rejected" && !rejectedUpdateByAssignmentId.has(update.assignment_id)) {
      rejectedUpdateByAssignmentId.set(update.assignment_id, update);
    }
  }

  for (const assignment of assignments ?? []) {
    if (!latestAssignmentByVolunteerId.has(assignment.volunteer_id)) {
      latestAssignmentByVolunteerId.set(assignment.volunteer_id, assignment);
    }

    if (
      OPEN_ASSIGNMENT_STATUSES.includes(assignment.assignment_status) &&
      !openAssignmentByVolunteerId.has(assignment.volunteer_id)
    ) {
      openAssignmentByVolunteerId.set(assignment.volunteer_id, assignment);
    }

    if (
      assignment.assignment_status === "completed" &&
      !latestCompletedAssignmentByVolunteerId.has(assignment.volunteer_id)
    ) {
      latestCompletedAssignmentByVolunteerId.set(assignment.volunteer_id, {
        ...assignment,
        completed_at:
          completedUpdateByAssignmentId.get(assignment.id)?.updated_at ?? assignment.created_at,
      });
    }

    if (
      assignment.assignment_status === "rejected" &&
      !latestRejectedAssignmentByVolunteerId.has(assignment.volunteer_id)
    ) {
      const rejectionUpdate = rejectedUpdateByAssignmentId.get(assignment.id);
      latestRejectedAssignmentByVolunteerId.set(assignment.volunteer_id, {
        ...assignment,
        rejected_at: rejectionUpdate?.updated_at ?? assignment.created_at,
        rejection_reason: rejectionUpdate?.notes ?? "",
      });
    }
  }

  return (volunteers ?? []).map((volunteer) => ({
    ...volunteer,
    assignment: openAssignmentByVolunteerId.get(volunteer.id) ?? null,
    latestAssignment: latestAssignmentByVolunteerId.get(volunteer.id) ?? null,
    latestCompletedAssignment: latestCompletedAssignmentByVolunteerId.get(volunteer.id) ?? null,
    latestRejectedAssignment: latestRejectedAssignmentByVolunteerId.get(volunteer.id) ?? null,
  }));
}

export async function createAssignmentForVolunteer(volunteer, assignmentInput = {}) {
  const existing = await getOpenAssignmentForVolunteer(volunteer.id);
  if (existing) {
    return { assignment: existing, alreadyAssigned: true };
  }

  const generated = generateAssignment(volunteer);
  const assignedRole = assignmentInput.assigned_role || generated.assigned_role;
  const assignedZone = assignmentInput.assigned_zone || generated.assigned_zone;
  const managerNotes = assignmentInput.assignment_reason?.trim();
  const assignmentReason = managerNotes || generated.assignment_reason;

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      volunteer_id: volunteer.id,
      assigned_zone: assignedZone,
      assigned_role: assignedRole,
      assignment_reason: assignmentReason,
      assignment_status: "assigned",
    })
    .select()
    .single();

  if (error) throw error;

  await createNotification({
    title: "Assignment Generated",
    message: `You have been assigned as ${data.assigned_role} at ${data.assigned_zone}.`,
    type: "assignment",
    recipient_user_id: volunteer.user_id,
    zone: data.assigned_zone,
  });

  return { assignment: data, alreadyAssigned: false };
}

export async function getAssignmentForVolunteer(volunteerId) {
  return getLatestAssignmentForVolunteer(volunteerId);
}

export async function getOpenAssignmentForVolunteer(volunteerId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .in("assignment_status", OPEN_ASSIGNMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLatestAssignmentForVolunteer(volunteerId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getMyAssignment(volunteerId) {
  if (!volunteerId) return null;
  return getLatestAssignmentForVolunteer(volunteerId);
}

export async function listAssignmentsForWorkforce() {
  const { data, error } = await supabase
    .from("assignments")
    .select(
      `
      *,
      volunteers (
        full_name,
        suitability_score,
        recommended_role
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function selectAssignedRole(volunteer) {
  if (volunteer.medical_training) return "Medical Aid Volunteer";
  if (volunteer.crowd_control) return "Crowd Management Volunteer";
  if ((volunteer.skills ?? []).includes("Language Assistance")) return "Help Desk Volunteer";
  return "General Operations Volunteer";
}

function selectPriority(score) {
  if (score >= 85) return "Critical Deployment";
  if (score >= 70) return "High Priority";
  return "Standard Priority";
}

function buildAssignmentReason({ volunteer, assigned_role, assigned_zone, priority }) {
  const evidence = [];

  if (volunteer.medical_training) evidence.push("medical training was provided");
  if (volunteer.crowd_control) evidence.push("crowd control experience was provided");
  if ((volunteer.skills ?? []).includes("Language Assistance")) {
    evidence.push("language assistance skill supports pilgrim help desk needs");
  }
  if (volunteer.preferred_zone) evidence.push("preferred zone matched operational requirements");
  if (volunteer.experience_level) evidence.push(`${volunteer.experience_level.toLowerCase()} experience was recorded`);

  const reason = evidence.length ? evidence.join(", ") : "general volunteer readiness was available";
  const score = volunteer.suitability_score ?? 0;

  return `Assigned to ${assigned_role} at ${assigned_zone} because ${reason}, suitability score is ${score}, and priority is ${priority}.`;
}
