export function VolunteerDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardCard label="Approval Status" value="Pending" />
      <DashboardCard label="Assigned Zone" value="Not assigned" />
      <DashboardCard label="Shift Status" value="Offline" />
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
