import {
  Bell,
  Bot,
  ClipboardCheck,
  Lightbulb,
  Home,
  MonitorDot,
  MapPinned,
  FileText,
  RadioTower,
  ShieldAlert,
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

export const SKILLS = [
  "Medical Aid",
  "Crowd Management",
  "Lost and Found",
  "Food Distribution",
  "Pilgrim Guidance",
  "Transport Support",
  "Security Support",
  "Emergency Response",
  "Language Assistance",
];

export const LANGUAGES = ["Hindi", "English", "Sanskrit", "Gujarati", "Marathi"];

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Experienced"];

export const volunteerNavItems = [
  { label: "Dashboard", href: "/volunteer/dashboard", icon: Home },
  { label: "Profile", href: "/volunteer/profile", icon: User },
  { label: "Tasks", href: "/volunteer/tasks", icon: ClipboardCheck },
  { label: "Notifications", href: "/volunteer/notifications", icon: Bell },
];

export const managerNavItems = [
  { label: "Dashboard", href: "/manager/dashboard", icon: Home },
  { label: "Assistant", href: "/manager/assistant", icon: Bot },
  { label: "Live Command", href: "/manager/live", icon: MonitorDot },
  { label: "Review", href: "/manager/review-volunteers", icon: Users },
  { label: "Assignments", href: "/manager/assignments", icon: ClipboardCheck },
  { label: "Workforce", href: "/manager/workforce", icon: MapPinned },
  { label: "Insights", href: "/manager/insights", icon: Lightbulb },
  { label: "Reports", href: "/manager/reports", icon: FileText },
  { label: "Emergency", href: "/manager/emergency", icon: ShieldAlert },
  { label: "Alerts", href: "/manager/notifications", icon: Bell },
  { label: "Simulator", href: "/manager/simulator", icon: RadioTower },
];
