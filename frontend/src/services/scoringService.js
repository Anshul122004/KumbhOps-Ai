export function calculateVolunteerScore(profile) {
  const skills = profile.skills ?? [];
  const languages = profile.languages ?? [];
  const reasons = [];
  let score = 0;

  if (profile.medical_training) {
    score += 25;
    reasons.push("medical training adds strong emergency readiness");
  }

  if (profile.crowd_control) {
    score += 20;
    reasons.push("crowd control experience improves high-density zone fit");
  }

  if (profile.experience_level === "Experienced") {
    score += 20;
    reasons.push("experienced volunteer profile adds operational reliability");
  } else if (profile.experience_level === "Intermediate") {
    score += 10;
    reasons.push("intermediate experience adds readiness");
  }

  if (skills.length) {
    score += skills.length * 5;
    reasons.push(`${skills.length} selected skill${skills.length === 1 ? "" : "s"} add deployment flexibility`);
  }

  if (languages.length > 2) {
    score += 10;
    reasons.push("more than two languages improves pilgrim communication");
  }

  const suitability_score = Math.min(score, 100);
  const recommended_role = getRecommendedRole(profile);
  const ai_reason = reasons.length
    ? `Score ${suitability_score}/100 because ${reasons.join(", ")}. Recommended for ${recommended_role}.`
    : `Score ${suitability_score}/100 because limited operational readiness signals were provided. Recommended for ${recommended_role}.`;

  return {
    suitability_score,
    recommended_role,
    ai_reason,
  };
}

function getRecommendedRole(profile) {
  const skills = profile.skills ?? [];

  if (profile.medical_training || skills.includes("Medical Aid")) {
    return "Medical Support Volunteer";
  }

  if (profile.crowd_control || skills.includes("Crowd Management")) {
    return "Crowd Management Volunteer";
  }

  if (skills.includes("Emergency Response")) {
    return "Emergency Response Volunteer";
  }

  if (skills.includes("Language Assistance") || (profile.languages ?? []).length > 2) {
    return "Pilgrim Guidance Volunteer";
  }

  if (skills.includes("Transport Support")) {
    return "Transport Support Volunteer";
  }

  if (skills.includes("Food Distribution")) {
    return "Food Distribution Volunteer";
  }

  if (skills.includes("Security Support")) {
    return "Security Support Volunteer";
  }

  return "General Operations Volunteer";
}
