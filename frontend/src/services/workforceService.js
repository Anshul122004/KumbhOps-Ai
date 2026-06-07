import { supabase } from "../lib/supabase";

export async function getWorkforceSummary() {
  const [
    totalVolunteers,
    approvedVolunteers,
    pendingVolunteers,
    rejectedVolunteers,
    totalAssignments,
    activeAssignments,
    activeEmergencies,
    criticalEmergencies,
  ] = await Promise.all([
    countRows("volunteers"),
    countRows("volunteers", { column: "status", value: "approved" }),
    countRows("volunteers", { column: "status", value: "pending" }),
    countRows("volunteers", { column: "status", value: "rejected" }),
    countRows("assignments"),
    countRows("assignments", { column: "assignment_status", value: "active" }),
    countRows("emergencies", { column: "status", value: "active" }),
    countCriticalActiveEmergencies(),
  ]);

  return {
    totalVolunteers,
    approvedVolunteers,
    pendingVolunteers,
    rejectedVolunteers,
    totalAssignments,
    activeAssignments,
    activeEmergencies,
    criticalEmergencies,
  };
}

export async function getZoneDistribution() {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, assigned_zone, assignment_status, volunteers(id)")
    .order("assigned_zone", { ascending: true });

  if (error) throw error;

  const byZone = new Map();

  for (const assignment of data ?? []) {
    const zone = assignment.assigned_zone || "Unassigned Zone";
    const current = byZone.get(zone) ?? {
      zone,
      assignedVolunteers: 0,
      activeAssignments: 0,
    };

    current.assignedVolunteers += 1;
    if (assignment.assignment_status === "active") {
      current.activeAssignments += 1;
    }

    byZone.set(zone, current);
  }

  return Array.from(byZone.values()).sort((a, b) =>
    a.zone.localeCompare(b.zone),
  );
}

export async function getRoleDistribution() {
  const { data, error } = await supabase
    .from("assignments")
    .select("assigned_role")
    .order("assigned_role", { ascending: true });

  if (error) throw error;

  const byRole = new Map();

  for (const assignment of data ?? []) {
    const role = assignment.assigned_role || "Unassigned Role";
    byRole.set(role, (byRole.get(role) ?? 0) + 1);
  }

  return Array.from(byRole.entries())
    .map(([role, assignedCount]) => ({ role, assignedCount }))
    .sort((a, b) => b.assignedCount - a.assignedCount || a.role.localeCompare(b.role));
}

export async function getEmergencyReadiness() {
  const { data, error } = await supabase
    .from("assignments")
    .select("assigned_role, assignment_status")
    .in("assignment_status", ["assigned", "active"]);

  if (error) throw error;

  const readiness = {
    medicalResponders: 0,
    crowdManagementResponders: 0,
    securityResponders: 0,
    generalOperations: 0,
  };

  for (const assignment of data ?? []) {
    const role = assignment.assigned_role;

    if (role === "Medical Aid Volunteer" || role === "Medical Support Volunteer") {
      readiness.medicalResponders += 1;
    }

    if (role === "Crowd Management Volunteer") {
      readiness.crowdManagementResponders += 1;
    }

    if (role === "Security Support Volunteer") {
      readiness.securityResponders += 1;
    }

    if (role === "General Operations Volunteer") {
      readiness.generalOperations += 1;
    }
  }

  return readiness;
}

async function countRows(table, filter) {
  let query = supabase.from(table).select("id", {
    count: "exact",
    head: true,
  });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count ?? 0;
}

async function countCriticalActiveEmergencies() {
  const { count, error } = await supabase
    .from("emergencies")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("priority", "critical");

  if (error) throw error;
  return count ?? 0;
}
