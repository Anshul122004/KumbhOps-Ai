import { useEffect, useMemo, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { SKILLS, UJJAIN_ZONES } from "../../lib/constants";
import {
  ASSIGNMENT_ROLES,
  createAssignmentForVolunteer,
  generateAssignment,
  listApprovedVolunteersWithAssignments,
} from "../../services/assignmentService";

const availabilityOptions = ["All", "Available", "Assigned", "Active"];

export function Assignments() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({
    zone: "All",
    skill: "All",
    availability: "All",
    search: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadVolunteers();
  }, []);

  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((volunteer) => {
      const availability = getAvailability(volunteer.assignment);
      const searchText = filters.search.trim().toLowerCase();
      const nameMatches =
        !searchText || (volunteer.full_name || "").toLowerCase().includes(searchText);
      const zoneMatches =
        filters.zone === "All" || volunteer.preferred_zone === filters.zone;
      const skillMatches =
        filters.skill === "All" ||
        (filters.skill === "Medical Training"
          ? volunteer.medical_training
          : filters.skill === "Crowd Control"
            ? volunteer.crowd_control
            : (volunteer.skills ?? []).includes(filters.skill));
      const availabilityMatches =
        filters.availability === "All" || availability === filters.availability;

      return nameMatches && zoneMatches && skillMatches && availabilityMatches;
    });
  }, [filters, volunteers]);

  async function loadVolunteers() {
    setLoading(true);
    setError("");
    try {
      const data = await listApprovedVolunteersWithAssignments();
      setVolunteers(data);
      setDrafts(buildDrafts(data));
    } catch (err) {
      setError(err.message || "Unable to load approved volunteers.");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(volunteerId, field, value) {
    setDrafts((current) => ({
      ...current,
      [volunteerId]: {
        ...current[volunteerId],
        [field]: value,
      },
    }));
  }

  function useAiRecommendation(volunteer) {
    const ai = generateAssignment(volunteer);
    setDrafts((current) => ({
      ...current,
      [volunteer.id]: {
        assigned_role: ai.assigned_role,
        assigned_zone: ai.assigned_zone,
        assignment_reason: ai.assignment_reason,
      },
    }));
  }

  function modifyAssignment(volunteer) {
    setDrafts((current) => ({
      ...current,
      [volunteer.id]: {
        ...current[volunteer.id],
        assignment_reason: "",
      },
    }));
  }

  async function handleCreateAssignment(volunteer) {
    const draft = drafts[volunteer.id] ?? generateAssignment(volunteer);
    setAssigningId(volunteer.id);
    setError("");
    setMessage("");

    try {
      const result = await createAssignmentForVolunteer(volunteer, draft);
      const { assignment, alreadyAssigned } = result;
      setVolunteers((current) =>
        current.map((item) =>
          item.id === volunteer.id
            ? { ...item, assignment, latestAssignment: assignment }
            : item,
        ),
      );
      setMessage(
        alreadyAssigned
          ? `${volunteer.full_name || "Volunteer"} already has an open assignment.`
          : `Assignment created for ${volunteer.full_name || "volunteer"}.`,
      );
    } catch (err) {
      setError(err.message || "Unable to create assignment.");
    } finally {
      setAssigningId("");
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Workforce Deployment</p>
            <h2 className="mt-1 text-2xl font-semibold">Volunteer Assignment Command Center</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Filter approved volunteers by zone, skill, training, and availability, then deploy
              them manually with AI recommendations as decision support.
            </p>
          </div>
          <Badge>{filteredVolunteers.length} shown</Badge>
        </div>
      </section>

      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="rounded-md border border-border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <FilterSelect
            label="Zone"
            value={filters.zone}
            onChange={(value) => setFilters((current) => ({ ...current, zone: value }))}
            options={["All", ...UJJAIN_ZONES]}
          />
          <FilterSelect
            label="Skill"
            value={filters.skill}
            onChange={(value) => setFilters((current) => ({ ...current, skill: value }))}
            options={["All", "Medical Training", "Crowd Control", ...SKILLS]}
          />
          <FilterSelect
            label="Availability"
            value={filters.availability}
            onChange={(value) => setFilters((current) => ({ ...current, availability: value }))}
            options={availabilityOptions}
          />
          <label className="grid gap-2 text-sm font-medium">
            Search Name
            <input
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="Search volunteer"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        {loading ? (
          <PanelState message="Loading approved volunteers..." />
        ) : volunteers.length === 0 ? (
          <PanelState
            title="No approved volunteers yet"
            message="Approve volunteers from the review queue before generating assignments."
          />
        ) : filteredVolunteers.length === 0 ? (
          <PanelState
            title="No volunteers match these filters"
            message="Try a broader zone, skill, availability, or name search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Volunteer</th>
                  <th className="px-4 py-3 font-semibold">Preferred Zone</th>
                  <th className="px-4 py-3 font-semibold">Skills</th>
                  <th className="px-4 py-3 font-semibold">Medical</th>
                  <th className="px-4 py-3 font-semibold">Crowd Control</th>
                  <th className="px-4 py-3 font-semibold">Experience</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Approval</th>
                  <th className="px-4 py-3 font-semibold">Current Assignment</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                  <th className="px-4 py-3 font-semibold">Deploy</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map((volunteer) => (
                  <VolunteerRow
                    key={volunteer.id}
                    volunteer={volunteer}
                    draft={drafts[volunteer.id] ?? generateAssignment(volunteer)}
                    assigning={assigningId === volunteer.id}
                    onDraftChange={updateDraft}
                    onUseAi={useAiRecommendation}
                    onModify={modifyAssignment}
                    onCreate={handleCreateAssignment}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function VolunteerRow({
  volunteer,
  draft,
  assigning,
  onDraftChange,
  onUseAi,
  onModify,
  onCreate,
}) {
  const ai = generateAssignment(volunteer);
  const availability = getAvailability(volunteer.assignment);
  const unavailable = availability === "Assigned" || availability === "Active";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-4 align-top">
        <p className="font-semibold">{volunteer.full_name || "Unnamed volunteer"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{volunteer.city || "City not set"}</p>
      </td>
      <td className="px-4 py-4 align-top">{volunteer.preferred_zone || "Not selected"}</td>
      <td className="px-4 py-4 align-top">
        <div className="flex max-w-64 flex-wrap gap-1.5">
          {(volunteer.skills ?? []).length ? (
            volunteer.skills.map((skill) => (
              <Badge key={skill} variant="info" className="normal-case">
                {skill}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">No skills listed</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <BooleanBadge value={volunteer.medical_training} />
      </td>
      <td className="px-4 py-4 align-top">
        <BooleanBadge value={volunteer.crowd_control} />
      </td>
      <td className="px-4 py-4 align-top">{volunteer.experience_level || "Not set"}</td>
      <td className="px-4 py-4 align-top">
        <ScoreBadge score={volunteer.suitability_score} />
      </td>
      <td className="px-4 py-4 align-top">
        <Badge variant={volunteer.status}>{volunteer.status}</Badge>
      </td>
      <td className="px-4 py-4 align-top">
        {volunteer.assignment ? (
          <div className="grid gap-2">
            <Badge variant={availabilityTone(availability)}>{volunteer.assignment.assignment_status}</Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              {volunteer.assignment.assigned_role} at {volunteer.assignment.assigned_zone}
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            <Badge variant="neutral">No open assignment</Badge>
            <TerminalAssignment
              completedAssignment={volunteer.latestCompletedAssignment}
              rejectedAssignment={volunteer.latestRejectedAssignment}
            />
          </div>
        )}
      </td>
      <td className="px-4 py-4 align-top">
        <Badge variant={availabilityTone(availability)}>{availability}</Badge>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="grid w-[320px] gap-3 rounded-md border border-border bg-background p-3">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">AI Guidance</p>
              <Badge variant={scoreTone(volunteer.suitability_score)}>
                {volunteer.suitability_score ?? 0}% confidence
              </Badge>
            </div>
            <p className="mt-2 text-sm font-semibold">{ai.assigned_role}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{volunteer.ai_reason || ai.assignment_reason}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                className="h-8 px-3 text-xs"
                variant="outline"
                disabled={unavailable}
                onClick={() => onUseAi(volunteer)}
              >
                Use AI Recommendation
              </Button>
              <Button
                className="h-8 px-3 text-xs"
                variant="ghost"
                disabled={unavailable}
                onClick={() => onModify(volunteer)}
              >
                Modify Assignment
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <CompactSelect
              label="Role"
              value={draft.assigned_role}
              disabled={unavailable}
              options={ASSIGNMENT_ROLES}
              onChange={(value) => onDraftChange(volunteer.id, "assigned_role", value)}
            />
            <CompactSelect
              label="Zone"
              value={draft.assigned_zone}
              disabled={unavailable}
              options={UJJAIN_ZONES}
              onChange={(value) => onDraftChange(volunteer.id, "assigned_zone", value)}
            />
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Notes / Reason
              <textarea
                className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-70"
                disabled={unavailable}
                value={draft.assignment_reason}
                onChange={(event) =>
                  onDraftChange(volunteer.id, "assignment_reason", event.target.value)
                }
              />
            </label>
          </div>

          <Button disabled={unavailable || assigning} onClick={() => onCreate(volunteer)}>
            {unavailable ? "Unavailable" : assigning ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function buildDrafts(volunteers) {
  return Object.fromEntries(
    (volunteers ?? []).map((volunteer) => {
      const ai = generateAssignment(volunteer);
      return [volunteer.id, ai];
    }),
  );
}

function getAvailability(openAssignment) {
  if (openAssignment?.assignment_status === "active") return "Active";
  if (openAssignment?.assignment_status === "assigned") return "Assigned";
  return "Available";
}

function availabilityTone(availability) {
  if (availability === "Available") return "approved";
  if (availability === "Active") return "pending";
  return "info";
}

function scoreTone(score) {
  if ((score ?? 0) >= 75) return "approved";
  if ((score ?? 0) >= 45) return "pending";
  return "neutral";
}

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return <Badge variant="neutral">Not scored</Badge>;
  }

  return <Badge variant={scoreTone(score)}>{score}/100</Badge>;
}

function BooleanBadge({ value }) {
  return <Badge variant={value ? "approved" : "neutral"}>{value ? "Yes" : "No"}</Badge>;
}

function TerminalAssignment({ completedAssignment, rejectedAssignment }) {
  if (rejectedAssignment) {
    return (
      <div className="grid gap-1">
        <Badge variant="rejected">Rejected</Badge>
        <p className="text-xs leading-5 text-muted-foreground">
          Current Status: Rejected
          <br />
          {rejectedAssignment.assigned_role} - {rejectedAssignment.assigned_zone}
          <br />
          Reason: {rejectedAssignment.rejection_reason || "No reason recorded"}
          <br />
          Rejected: {formatDate(rejectedAssignment.rejected_at ?? rejectedAssignment.created_at)}
        </p>
      </div>
    );
  }

  if (!completedAssignment) {
    return <p className="text-xs text-muted-foreground">No completed history</p>;
  }

  return (
    <p className="text-xs leading-5 text-muted-foreground">
      Last Completed: {completedAssignment.assigned_role} - {completedAssignment.assigned_zone}
      <br />
      Completed: {formatDate(completedAssignment.completed_at ?? completedAssignment.created_at)}
    </p>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompactSelect({ label, value, options, disabled, onChange }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-70"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PanelState({ title, message }) {
  return (
    <div className="p-6">
      {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
      <p className={title ? "mt-2 text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>
        {message}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
