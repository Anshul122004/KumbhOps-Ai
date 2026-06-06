export function VolunteerPlaceholderPage({ title }) {
  return (
    <section className="rounded-md border border-border bg-card p-6">
      <p className="text-sm font-medium text-primary">Volunteer Portal</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-muted-foreground">This page is reserved for the next MVP module.</p>
    </section>
  );
}
