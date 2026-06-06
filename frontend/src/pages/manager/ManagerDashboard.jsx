export function ManagerDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <DashboardCard label="Total Volunteers" value="0" />
      <DashboardCard label="Pending Review" value="0" />
      <DashboardCard label="Active Zones" value="10" />
      <DashboardCard label="Emergencies" value="0" />
    </div>
  );
}

function DashboardCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold">{value}</h2>
    </section>
  );
}
