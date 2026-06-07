import { supabase } from "../lib/supabase";

export async function createNotification(notification, options = {}) {
  const payload = normalizeNotification(notification);

  console.log("NOTIFICATION PAYLOAD:", payload);

  if (options.broadcastToVolunteers) {
    return createVolunteerBroadcast(payload);
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listUnreadNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createVolunteerBroadcast(notification) {
  const { data: volunteers, error: volunteerError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "volunteer");

  if (volunteerError) throw volunteerError;

  if (!volunteers?.length) {
    return [];
  }

  const rows = volunteers.map((volunteer) => ({
    ...notification,
    recipient_role: "volunteer",
    recipient_user_id: volunteer.id,
  }));

  const { data, error } = await supabase
    .from("notifications")
    .insert(rows)
    .select();

  if (error) throw error;
  return data ?? [];
}

function normalizeNotification(notification) {
  return {
    title: notification.title.trim(),
    message: notification.message.trim(),
    type: notification.type,
    recipient_role: notification.recipient_role ?? null,
    recipient_user_id: notification.recipient_user_id ?? null,
    zone: notification.zone || null,
  };
}
