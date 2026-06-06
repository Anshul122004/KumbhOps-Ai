import { AppShell } from "./AppShell";
import { managerNavItems } from "../../lib/constants";

export function ManagerLayout() {
  return <AppShell title="Manager Portal" navItems={managerNavItems} />;
}
