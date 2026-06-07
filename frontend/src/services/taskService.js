import { supabase } from "../lib/supabase";
import { createNotification } from "./notificationService";

export async function getVolunteerTasks(userId) {
  const volunteer = await getVolunteerByUserId(userId);

  if (!volunteer) {
    return {
      volunteer: null,
      assignment: null,
      updates: [],
      emergencies: [],
      history: [],
      stats: {
        assignedTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
      },
    };
  }

  const [assignment, emergencies, history] = await Promise.all([
    getAssignmentForVolunteer(volunteer.id),
    getActiveEmergencies(),
    getTaskHistory(volunteer.id),
  ]);

  const rejectedAssignment = assignment ? null : await getLatestRejectedAssignment(volunteer.id);
  const timelineAssignment = assignment ?? rejectedAssignment;
  const updates = timelineAssignment ? await getTaskUpdates(timelineAssignment.id) : [];
  const currentStatus = assignment
    ? getCurrentTaskStatus(assignment, updates)
    : rejectedAssignment
      ? "rejected"
      : "none";

  return {
    volunteer,
    assignment,
    rejectedAssignment,
    timelineAssignment,
    updates,
    emergencies,
    history,
    currentStatus,
    stats: {
      assignedTasks: assignment && currentStatus !== "completed" && currentStatus !== "rejected" ? 1 : 0,
      activeTasks: currentStatus === "active" ? 1 : 0,
      completedTasks: history.length,
    },
  };
}

export async function getTaskHistory(volunteerId) {
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .eq("assignment_status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const completedAssignments = assignments ?? [];
  const updatesByAssignment = await getLatestCompletedUpdates(completedAssignments.map((item) => item.id));

  return completedAssignments.map((assignment) => ({
    ...assignment,
    completed_at: updatesByAssignment.get(assignment.id)?.updated_at ?? assignment.created_at,
  }));
}

export async function addTaskUpdate({ assignmentId, volunteerId, status, notes = "" }) {
  const { data, error } = await supabase
    .from("task_updates")
    .insert({
      assignment_id: assignmentId,
      volunteer_id: volunteerId,
      status,
      notes: notes.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptTask({ assignment, volunteer, notes }) {
  const update = await addTaskUpdate({
    assignmentId: assignment.id,
    volunteerId: volunteer.id,
    status: "accepted",
    notes,
  });

  await notifyManagersSafely({
    title: "Task Accepted",
    message: `${volunteer.full_name || "Volunteer"} accepted ${assignment.assigned_role} at ${assignment.assigned_zone}.`,
    zone: assignment.assigned_zone,
  });

  return update;
}

export async function startTask({ assignment, volunteer, notes }) {
  const enRouteUpdate = await addTaskUpdate({
    assignmentId: assignment.id,
    volunteerId: volunteer.id,
    status: "en_route",
    notes,
  });

  const activeUpdate = await addTaskUpdate({
    assignmentId: assignment.id,
    volunteerId: volunteer.id,
    status: "active",
    notes: "Duty started.",
  });

  await updateAssignmentStatus(assignment.id, "active");

  await notifyManagersSafely({
    title: "Task Started",
    message: `${volunteer.full_name || "Volunteer"} started duty as ${assignment.assigned_role} at ${assignment.assigned_zone}.`,
    zone: assignment.assigned_zone,
  });

  return [enRouteUpdate, activeUpdate];
}

export async function completeTask({ assignment, volunteer, notes }) {
  const update = await addTaskUpdate({
    assignmentId: assignment.id,
    volunteerId: volunteer.id,
    status: "completed",
    notes,
  });

  await updateAssignmentStatus(assignment.id, "completed");

  await notifyManagersSafely({
    title: "Task Completed",
    message: `${volunteer.full_name || "Volunteer"} completed ${assignment.assigned_role} at ${assignment.assigned_zone}.`,
    zone: assignment.assigned_zone,
  });

  return update;
}

export async function rejectTask({ assignment, volunteer, reason }) {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error("A rejection reason is required.");
  }

  const update = await addTaskUpdate({
    assignmentId: assignment.id,
    volunteerId: volunteer.id,
    status: "rejected",
    notes: cleanReason,
  });

  await updateAssignmentStatus(assignment.id, "rejected");

  await notifyManagersSafely({
    title: "Assignment Rejected",
    message: `${volunteer.full_name || "Volunteer"} rejected assignment "${assignment.assigned_role}" at ${assignment.assigned_zone}.\n\nReason: ${cleanReason}`,
    zone: assignment.assigned_zone,
  });

  return update;
}

export function buildTaskTimeline(assignment, updates) {
  if (!assignment) return [];

  return [
    {
      id: `assignment-${assignment.id}`,
      status: "assigned",
      label: "Assignment Created",
      notes: assignment.assignment_reason,
      updated_at: assignment.created_at,
    },
    ...(updates ?? []).map((update) => ({
      id: update.id,
      status: update.status,
      label: statusLabel(update.status),
      notes: update.notes,
      updated_at: update.updated_at,
    })),
  ].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
}

export function getCurrentTaskStatus(assignment, updates) {
  if (!assignment) return "none";
  if (assignment.assignment_status === "rejected") return "rejected";
  if (assignment.assignment_status === "completed") return "completed";
  if (assignment.assignment_status === "active") return "active";

  const latest = [...(updates ?? [])].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  )[0];

  if (latest?.status === "completed") return "completed";
  if (latest?.status === "rejected") return "rejected";
  if (latest?.status === "active") return "active";
  if (latest?.status === "accepted" || latest?.status === "en_route") return "accepted";

  return "assigned";
}

function statusLabel(status) {
  const labels = {
    assigned: "Assignment Created",
    accepted: "Task Accepted",
    en_route: "Volunteer En Route",
    active: "Duty Started",
    completed: "Task Completed",
    rejected: "Assignment Rejected",
  };

  return labels[status] ?? status;
}

async function getVolunteerByUserId(userId) {
  console.log("USER ID RECEIVED:", userId);

  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("VOLUNTEER QUERY RESULT:", data);
  console.log("VOLUNTEER QUERY ERROR:", error);

  if (error) throw error;
  return data;
}

async function getAssignmentForVolunteer(volunteerId) {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .in("assignment_status", ["assigned", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getLatestRejectedAssignment(volunteerId) {
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .eq("assignment_status", "rejected")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!assignment) return null;

  const updates = await getTaskUpdates(assignment.id);
  const rejectionUpdate = [...updates]
    .filter((update) => update.status === "rejected")
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  return {
    ...assignment,
    rejected_at: rejectionUpdate?.updated_at ?? assignment.created_at,
    rejection_reason: rejectionUpdate?.notes ?? "",
  };
}

async function getTaskUpdates(assignmentId) {
  const { data, error } = await supabase
    .from("task_updates")
    .select("*")
    .eq("assignment_id", assignmentId)
    .order("updated_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function getActiveEmergencies() {
  const { data, error } = await supabase
    .from("emergencies")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function getLatestCompletedUpdates(assignmentIds) {
  const updatesByAssignment = new Map();
  if (!assignmentIds.length) return updatesByAssignment;

  const { data, error } = await supabase
    .from("task_updates")
    .select("*")
    .in("assignment_id", assignmentIds)
    .eq("status", "completed")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  for (const update of data ?? []) {
    if (!updatesByAssignment.has(update.assignment_id)) {
      updatesByAssignment.set(update.assignment_id, update);
    }
  }

  return updatesByAssignment;
}

async function updateAssignmentStatus(assignmentId, assignmentStatus) {
  const { error } = await supabase
    .from("assignments")
    .update({ assignment_status: assignmentStatus })
    .eq("id", assignmentId);

  if (error) throw error;
}

async function notifyManagers({ title, message, zone }) {
  await createNotification({
    title,
    message,
    type: "assignment",
    recipient_role: "manager",
    zone,
  });
}

async function notifyManagersSafely(notification) {
  try {
    await notifyManagers(notification);
  } catch (error) {
    console.error("Notification failed", error);
  }
}
