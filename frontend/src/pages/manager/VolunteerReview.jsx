import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { createNotification } from "../../services/notificationService";
import {
  listVolunteersForReview,
  updateVolunteerStatus,
} from "../../services/volunteerService";

export function VolunteerReview() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadVolunteers();
  }, []);

  async function loadVolunteers() {
    setError("");
    setLoading(true);
    try {
      const data = await listVolunteersForReview();
      setVolunteers(data);
    } catch (err) {
      setError(err.message || "Unable to load volunteers.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(volunteerId, status) {
    setError("");
    setUpdatingId(volunteerId);
    try {
      const updated = await updateVolunteerStatus(volunteerId, status);
      await createNotification({
        title: status === "approved" ? "Volunteer Approved" : "Volunteer Rejected",
        message:
          status === "approved"
            ? "Your volunteer profile has been approved for KumbhOps deployment."
            : "Your volunteer profile has been rejected by the manager team.",
        type: "approval",
        recipient_user_id: updated.user_id,
      });
      setVolunteers((current) =>
        current.map((volunteer) => (volunteer.id === volunteerId ? updated : volunteer)),
      );
    } catch (err) {
      setError(err.message || `Unable to mark volunteer as ${status}.`);
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Manager Review</p>
            <h2 className="mt-1 text-2xl font-semibold">Volunteer Approval Queue</h2>
          </div>
          <Badge>{volunteers.length} volunteers</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Review submitted profiles and approve deployment readiness for the demo workflow.
        </p>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="overflow-hidden rounded-md border border-border bg-card">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading volunteers...</div>
        ) : volunteers.length === 0 ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold">No volunteer profiles yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Volunteers will appear here after they complete their profile page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Skills</th>
                  <th className="px-4 py-3 font-semibold">Preferred Zone</th>
                  <th className="px-4 py-3 font-semibold">Experience</th>
                  <th className="px-4 py-3 font-semibold">AI Score</th>
                  <th className="px-4 py-3 font-semibold">Recommended Role</th>
                  <th className="px-4 py-3 font-semibold">AI Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold">{volunteer.full_name || "Unnamed volunteer"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{volunteer.phone}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex max-w-md flex-wrap gap-1.5">
                        {(volunteer.skills ?? []).length ? (
                          volunteer.skills.map((skill) => (
                            <Badge key={skill} variant="neutral">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No skills</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">{volunteer.preferred_zone || "Not selected"}</td>
                    <td className="px-4 py-4 align-top">
                      {volunteer.experience_level || "Not selected"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ScoreBadge score={volunteer.suitability_score} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {volunteer.recommended_role || "Not scored"}
                    </td>
                    <td className="max-w-sm px-4 py-4 align-top text-muted-foreground">
                      {volunteer.ai_reason || "Save profile to generate AI reasoning."}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant={volunteer.status}>{volunteer.status}</Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex gap-2">
                        <Button
                          className="bg-green-600 text-white hover:bg-green-700"
                          disabled={updatingId === volunteer.id}
                          onClick={() => handleStatusChange(volunteer.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          className="bg-red-600 text-white hover:bg-red-700"
                          disabled={updatingId === volunteer.id}
                          onClick={() => handleStatusChange(volunteer.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return <Badge variant="neutral">Not scored</Badge>;
  }

  const tone = score >= 75 ? "approved" : score >= 45 ? "pending" : "rejected";
  return <Badge variant={tone}>{score}/100</Badge>;
}
