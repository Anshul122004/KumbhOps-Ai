import {
  Activity,
  Bell,
  ClipboardCheck,
  Home,
  MapPinned,
  RadioTower,
  ShieldAlert,
  Sparkles,
  User,
  Users,
} from "lucide-react";

export const UJJAIN_ZONES = [
  "Mahakal Lok",
  "Mahakaleshwar Temple",
  "Ram Ghat",
  "Harsiddhi Temple",
  "Kal Bhairav Temple",
  "Mangalnath Temple",
  "Freeganj",
  "Nanakheda",
  "Madhav Nagar",
  "Dewas Road",
];

export const volunteerNavItems = [
  { label: "Dashboard", href: "/volunteer/dashboard", icon: Home },
  { label: "Profile", href: "/volunteer/profile", icon: User },
  { label: "Tasks", href: "/volunteer/tasks", icon: ClipboardCheck },
  { label: "Shift", href: "/volunteer/shift", icon: Activity },
  { label: "Notifications", href: "/volunteer/notifications", icon: Bell },
];

export const managerNavItems = [
  { label: "Dashboard", href: "/manager/dashboard", icon: Home },
  { label: "Review", href: "/manager/review-volunteers", icon: Users },
  { label: "Assignments", href: "/manager/assignments", icon: ClipboardCheck },
  { label: "Workforce", href: "/manager/workforce", icon: MapPinned },
  { label: "Emergency", href: "/manager/emergency", icon: ShieldAlert },
  { label: "AI Command", href: "/manager/ai-command", icon: Sparkles },
  { label: "Live Ops", href: "/manager/workforce", icon: RadioTower },
];
