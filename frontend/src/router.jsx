import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ManagerLayout } from "./components/layout/ManagerLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { VolunteerLayout } from "./components/layout/VolunteerLayout";
import { LandingPage } from "./pages/public/LandingPage";
import { LoginPage } from "./pages/public/LoginPage";
import { ManagerLoginPage } from "./pages/public/ManagerLoginPage";
import { VolunteerLoginPage } from "./pages/public/VolunteerLoginPage";
import { VolunteerRegisterPage } from "./pages/public/VolunteerRegisterPage";
import { Assignments } from "./pages/manager/Assignments";
import { Assistant } from "./pages/manager/Assistant";
import { Emergency } from "./pages/manager/Emergency";
import { Insights } from "./pages/manager/Insights";
import { LiveCommand } from "./pages/manager/LiveCommand";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerPlaceholderPage } from "./pages/manager/ManagerPlaceholderPage";
import { NotificationCenter } from "./pages/manager/NotificationCenter";
import { Reports } from "./pages/manager/Reports";
import { Simulator } from "./pages/manager/Simulator";
import { VolunteerReview } from "./pages/manager/VolunteerReview";
import { Workforce } from "./pages/manager/Workforce";
import { VolunteerDashboard } from "./pages/volunteer/VolunteerDashboard";
import { VolunteerNotifications } from "./pages/volunteer/VolunteerNotifications";
import { VolunteerProfile } from "./pages/volunteer/VolunteerProfile";
import { Tasks } from "./pages/volunteer/Tasks";
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
          { path: "/volunteer/register", element: <VolunteerRegisterPage /> },
          { path: "/volunteer/login", element: <VolunteerLoginPage /> },
          { path: "/manager/login", element: <ManagerLoginPage /> },
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
          { path: "profile", element: <VolunteerProfile /> },
          { path: "tasks", element: <Tasks /> },
          { path: "notifications", element: <VolunteerNotifications /> },
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
          { path: "assistant", element: <Assistant /> },
          { path: "live", element: <LiveCommand /> },
          { path: "review-volunteers", element: <VolunteerReview /> },
          { path: "assignments", element: <Assignments /> },
          { path: "workforce", element: <Workforce /> },
          { path: "insights", element: <Insights /> },
          { path: "reports", element: <Reports /> },
          { path: "emergency", element: <Emergency /> },
          { path: "notifications", element: <NotificationCenter /> },
          { path: "simulator", element: <Simulator /> },
          { path: "scenario-simulator", element: <Simulator /> },
        ],
      },
    ],
  },
]);
