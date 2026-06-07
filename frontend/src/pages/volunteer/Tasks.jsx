import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import {
  acceptTask,
  buildTaskTimeline,
  completeTask,
  getVolunteerTasks,
  rejectTask,
  startTask,
} from "../../services/taskService";
import { formatIncidentType } from "../../services/emergencyService";

const rejectionOptions = [
  "Medical issue",
  "Personal emergency",
  "Already deployed elsewhere",
  "Travel delay",
  "Unable to reach assigned zone",
  "Other",
];

export function Tasks() {
  const { user } = useAuth();
  const [taskData, setTaskData] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionOption, setRejectionOption] = useState(rejectionOptions[0]);
  const [rejectionText, setRejectionText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  async function loadTasks() {
     setLoading(true);
    setError("");

    try {
      console.log("AUTH USER ID:", user?.id);

      const data = await getVolunteerTasks(user?.id);

      console.log("TASK DATA:", data);

      setTaskData(data);
    } catch (err) {
        console.log("TASK ERROR:", err);
        setError(err.message || "Unable to load tasks.");
    } finally {
        setLoading(false);
      }
  }

  async function handleAction(action) {
    if (!taskData?.assignment || !taskData?.volunteer) return;

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      if (action === "accept") {
        await acceptTask({
          assignment: taskData.assignment,
          volunteer: taskData.volunteer,
          notes,
        });
        setMessage("Task accepted.");
      }

      if (action === "start") {
        await startTask({
          assignment: taskData.assignment,
          volunteer: taskData.volunteer,
          notes,
        });
        setMessage("Duty started.");
      }

      if (action === "complete") {
        await completeTask({
          assignment: taskData.assignment,
          volunteer: taskData.volunteer,
          notes,
        });
        setMessage("Task completed.");
      }

      setNotes("");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to update task.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleRejectTask() {
    if (!taskData?.assignment || !taskData?.volunteer) return;

    const reason = buildRejectionReason(rejectionOption, rejectionText);
    if (!reason) {
      setError("Please enter a reason before rejecting this assignment.");
      return;
    }

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      await rejectTask({
        assignment: taskData.assignment,
        volunteer: taskData.volunteer,
        reason,
      });
      setMessage("Assignment rejected. You are available for a new assignment.");
      setRejectDialogOpen(false);
      setRejectionOption(rejectionOptions[0]);
      setRejectionText("");
      setNotes("");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to reject assignment.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <PanelState message="Loading volunteer tasks..." />;
  }

  if (!taskData?.volunteer) {
    return (
      <PanelState message="Complete your volunteer profile before receiving tasks." />
    );
  }

  const assignment = taskData.assignment;
  const rejectedAssignment = taskData.rejectedAssignment;
  const timeline = buildTaskTimeline(taskData.timelineAssignment, taskData.updates);

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Volunteer Duties</p>
            <h2 className="mt-1 text-2xl font-semibold">Task Management</h2>
          </div>
          <Badge variant={taskTone(taskData.currentStatus)}>{taskData.currentStatus}</Badge>
        </div>
      </section>

      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned Tasks" value={taskData.stats.assignedTasks} />
        <StatCard label="Active Tasks" value={taskData.stats.activeTasks} />
        <StatCard label="Completed Tasks" value={taskData.stats.completedTasks} />
      </div>

      {assignment ? (
        <section className="rounded-md border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Current Assignment</p>
              <h3 className="mt-1 text-xl font-semibold">{assignment.assigned_role}</h3>
            </div>
            <Badge variant={taskTone(taskData.currentStatus)}>{taskData.currentStatus}</Badge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="Assigned Zone" value={assignment.assigned_zone || "Not assigned"} />
            <Info label="Assignment Status" value={assignment.assignment_status} />
            <Info label="Assignment Date" value={formatDate(assignment.created_at)} />
            <Info label="Assignment Reason" value={assignment.assignment_reason || "No reason recorded"} />
          </div>

          {taskData.currentStatus !== "completed" ? (
            <div className="mt-5 grid gap-3">
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Add operational notes, for example: Medical kit delivered."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {taskData.currentStatus === "assigned" ? (
                  <>
                    <Button disabled={updating} onClick={() => handleAction("accept")}>
                      {updating ? "Updating..." : "Accept Task"}
                    </Button>
                    <Button
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      disabled={updating}
                      variant="outline"
                      onClick={() => {
                        setError("");
                        setRejectDialogOpen(true);
                      }}
                    >
                      Reject Task
                    </Button>
                  </>
                ) : null}
                {taskData.currentStatus === "accepted" ? (
                  <Button disabled={updating} onClick={() => handleAction("start")}>
                    {updating ? "Updating..." : "Start Duty"}
                  </Button>
                ) : null}
                {taskData.currentStatus === "active" ? (
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={updating}
                    onClick={() => handleAction("complete")}
                  >
                    {updating ? "Updating..." : "Mark Completed"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Completed tasks are read-only.</p>
          )}
        </section>
      ) : rejectedAssignment ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-700">Assignment Rejected</p>
              <h3 className="mt-1 text-xl font-semibold text-red-950">
                {rejectedAssignment.assigned_role}
              </h3>
            </div>
            <Badge variant="rejected">Rejected</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="Assigned Zone" value={rejectedAssignment.assigned_zone || "Not assigned"} />
            <Info label="Rejected At" value={formatDate(rejectedAssignment.rejected_at)} />
            <Info
              label="Reason"
              value={rejectedAssignment.rejection_reason || "No reason recorded"}
            />
            <Info label="Status" value="Rejected" />
          </div>
          <p className="mt-4 text-sm text-red-800">
            This assignment is closed. You are available for future assignments.
          </p>
        </section>
      ) : (
        <EmptyState
          title="No assigned duty yet"
          text="Your manager-generated assignment will appear here once available."
        />
      )}

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Emergency Tasks</p>
            <h3 className="mt-1 text-xl font-semibold">Active Response Duties</h3>
          </div>
          <Badge variant={taskData.emergencies.length ? "rejected" : "neutral"}>
            {taskData.emergencies.length} active
          </Badge>
        </div>

        {taskData.emergencies.length ? (
          <div className="mt-4 grid gap-3">
            {taskData.emergencies.map((emergency) => (
              <article key={emergency.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-semibold">{emergency.title}</h4>
                  <Badge variant={priorityTone(emergency.priority)}>{emergency.priority}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <p>Incident: {formatIncidentType(emergency.incident_type)}</p>
                  <p>Zone: {emergency.zone}</p>
                  <p>Status: {emergency.status}</p>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                  {emergency.response_plan || "Response plan pending."}
                </pre>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No active emergency response tasks.</p>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h3 className="text-xl font-semibold">Task Timeline</h3>
        {timeline.length ? (
          <div className="mt-4 grid gap-3">
            {timeline.map((item) => (
              <article key={item.id} className="rounded-md border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{item.label}</h4>
                    {item.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <Badge variant={taskTone(item.status)}>{item.status}</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.updated_at)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No timeline events yet.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border p-5">
          <h3 className="text-xl font-semibold">Task History</h3>
          <p className="mt-1 text-sm text-muted-foreground">Completed assignments, newest first.</p>
        </div>

        {taskData.history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Completed Date</th>
                </tr>
              </thead>
              <tbody>
                {taskData.history.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 font-semibold">{item.assigned_role}</td>
                    <td className="px-4 py-4">{item.assigned_zone}</td>
                    <td className="px-4 py-4">
                      <Badge variant="approved">{item.assignment_status}</Badge>
                    </td>
                    <td className="px-4 py-4">{formatDate(item.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <h4 className="text-lg font-semibold">No completed tasks yet</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Completed assignments will appear here after duty closure.
            </p>
          </div>
        )}
      </section>

      {rejectDialogOpen ? (
        <RejectAssignmentDialog
          option={rejectionOption}
          customText={rejectionText}
          updating={updating}
          onOptionChange={setRejectionOption}
          onCustomTextChange={setRejectionText}
          onCancel={() => {
            if (!updating) setRejectDialogOpen(false);
          }}
          onConfirm={handleRejectTask}
        />
      ) : null}
    </div>
  );
}

function buildRejectionReason(option, customText) {
  const text = customText.trim();
  if (option === "Other") return text;
  return text ? `${option}: ${text}` : option;
}

function StatCard({ label, value }) {
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <section className="rounded-md border border-border bg-card p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </section>
  );
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </section>
  );
}

function taskTone(status) {
  if (status === "rejected") return "rejected";
  if (status === "completed") return "approved";
  if (status === "active") return "info";
  if (status === "accepted" || status === "en_route") return "pending";
  return "neutral";
}

function RejectAssignmentDialog({
  option,
  customText,
  updating,
  onOptionChange,
  onCustomTextChange,
  onCancel,
  onConfirm,
}) {
  const reason = buildRejectionReason(option, customText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <section className="w-full max-w-lg rounded-md border border-border bg-card p-5 shadow-xl">
        <div>
          <p className="text-sm font-semibold text-red-700">Reject Assignment</p>
          <h3 className="mt-1 text-xl font-semibold">Please provide a reason for rejecting this assignment.</h3>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Suggested Reason
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              value={option}
              onChange={(event) => onOptionChange(event.target.value)}
            >
              {rejectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Reason {option === "Other" ? "(required)" : "(optional details)"}
            <textarea
              className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={
                option === "Other"
                  ? "Enter rejection reason"
                  : "Add any extra context for the manager"
              }
              value={customText}
              onChange={(event) => onCustomTextChange(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={updating} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={updating || !reason}
            onClick={onConfirm}
          >
            {updating ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function priorityTone(priority) {
  if (priority === "critical") return "rejected";
  if (priority === "high") return "high";
  if (priority === "medium") return "pending";
  return "info";
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
