import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { supabase } from "../../lib/supabase";

const initialStats = {
  totalVolunteers: 0,
  pendingReview: 0,
  approvedVolunteers: 0,
  activeZones: 0,
  emergencies: 0,
};

export function ManagerDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      if (!mounted) return;
      setLoading(true);
      setError("");

      try {
        const nextStats = await fetchDashboardStats();
        if (mounted) setStats(nextStats);
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load dashboard statistics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    const channel = supabase
      .channel("manager-dashboard-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, loadDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "emergencies" }, loadDashboard)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {["Total Volunteers", "Pending Review", "Approved Volunteers", "Active Zones", "Emergencies"].map(
          (label) => (
            <DashboardCard key={label} label={label} value="Loading..." />
          ),
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-5">
        <DashboardCard label="Total Volunteers" value={stats.totalVolunteers} />
        <DashboardCard label="Pending Review" value={stats.pendingReview} />
        <DashboardCard label="Approved Volunteers" value={stats.approvedVolunteers} />
        <DashboardCard label="Active Zones" value={stats.activeZones} />
        <DashboardCard label="Emergencies" value={stats.emergencies} />
      </div>
    </div>
  );
}

async function fetchDashboardStats() {
  const [{ data: volunteers, error: volunteerError }, { data: emergencies, error: emergencyError }] =
    await Promise.all([
      supabase.from("volunteers").select("id, status, preferred_zone"),
      supabase.from("emergencies").select("id, status, zone"),
    ]);

  if (volunteerError) throw volunteerError;
  if (emergencyError) throw emergencyError;

  console.log("Manager dashboard volunteers:", volunteers);
  console.log("Manager dashboard emergencies:", emergencies);

  const volunteerRows = volunteers ?? [];
  const emergencyRows = emergencies ?? [];
  const approvedVolunteers = volunteerRows.filter((volunteer) => volunteer.status === "approved");
  const activeEmergencies = emergencyRows.filter((emergency) => emergency.status === "active");
  const activeZones = new Set([
    ...approvedVolunteers.map((volunteer) => volunteer.preferred_zone).filter(Boolean),
    ...activeEmergencies.map((emergency) => emergency.zone).filter(Boolean),
  ]);

  return {
    totalVolunteers: volunteerRows.length,
    pendingReview: volunteerRows.filter((volunteer) => volunteer.status === "pending").length,
    approvedVolunteers: approvedVolunteers.length,
    activeZones: activeZones.size,
    emergencies: activeEmergencies.length,
  };
}

function DashboardCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold">{value}</h2>
    </section>
  );
}
