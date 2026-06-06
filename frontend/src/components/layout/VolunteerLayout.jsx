import { AppShell } from "./AppShell";
import { volunteerNavItems } from "../../lib/constants";

export function VolunteerLayout() {
  return <AppShell title="Volunteer Portal" navItems={volunteerNavItems} />;
}
