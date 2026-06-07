import { supabase } from "../lib/supabase";
import { calculateVolunteerScore } from "./scoringService";

export async function getMyVolunteerProfile(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveMyVolunteerProfile(userId, profile) {
  const scoring = calculateVolunteerScore(profile);
  const payload = {
    user_id: userId,
    full_name: profile.full_name.trim(),
    phone: profile.phone.trim(),
    age: profile.age ? Number(profile.age) : null,
    gender: profile.gender,
    address: profile.address.trim(),
    city: profile.city.trim(),
    preferred_zone: profile.preferred_zone,
    skills: profile.skills,
    languages: profile.languages,
    experience_level: profile.experience_level,
    medical_training: profile.medical_training,
    crowd_control: profile.crowd_control,
    suitability_score: scoring.suitability_score,
    recommended_role: scoring.recommended_role,
    ai_reason: scoring.ai_reason,
  };

  const { data, error } = await supabase
    .from("volunteers")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listVolunteersForReview() {
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateVolunteerStatus(volunteerId, status) {
  const { data, error } = await supabase
    .from("volunteers")
    .update({ status })
    .eq("id", volunteerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
