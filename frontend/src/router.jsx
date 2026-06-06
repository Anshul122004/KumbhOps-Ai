import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ManagerLayout } from "./components/layout/ManagerLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { VolunteerLayout } from "./components/layout/VolunteerLayout";
import { LandingPage } from "./pages/public/LandingPage";
import { LoginPage } from "./pages/public/LoginPage";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerPlaceholderPage } from "./pages/manager/ManagerPlaceholderPage";
import { VolunteerDashboard } from "./pages/volunteer/VolunteerDashboard";
import { VolunteerPlaceholderPage } from "./pages/volunteer/VolunteerPlaceholderPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: "/", element: <LandingPage /> },
          { path: "/login", element: <LoginPage /> },
        ],
      },
      {
        path: "/volunteer",
        element: (
          <ProtectedRoute allowedRoles={["volunteer"]}>
            <VolunteerLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/volunteer/dashboard" replace /> },
          { path: "dashboard", element: <VolunteerDashboard /> },
          { path: "profile", element: <VolunteerPlaceholderPage title="Profile" /> },
          { path: "tasks", element: <VolunteerPlaceholderPage title="Tasks" /> },
          { path: "shift", element: <VolunteerPlaceholderPage title="Shift" /> },
          { path: "notifications", element: <VolunteerPlaceholderPage title="Notifications" /> },
        ],
      },
      {
        path: "/manager",
        element: (
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="/manager/dashboard" replace /> },
          { path: "dashboard", element: <ManagerDashboard /> },
          { path: "review-volunteers", element: <ManagerPlaceholderPage title="Volunteer Review" /> },
          { path: "assignments", element: <ManagerPlaceholderPage title="Assignment Board" /> },
          { path: "workforce", element: <ManagerPlaceholderPage title="Workforce Monitor" /> },
          { path: "emergency", element: <ManagerPlaceholderPage title="Emergency Center" /> },
          { path: "ai-command", element: <ManagerPlaceholderPage title="AI Command Center" /> },
        ],
      },
    ],
  },
]);
