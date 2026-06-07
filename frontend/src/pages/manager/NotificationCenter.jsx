import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { UJJAIN_ZONES } from "../../lib/constants";
import {
  createNotification,
  listNotifications,
} from "../../services/notificationService";

const emptyForm = {
  title: "",
  message: "",
  type: "announcement",
  zone: "",
};

export function NotificationCenter() {
  const [form, setForm] = useState(emptyForm);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const data = await listNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.message || "Unable to load notification history.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setError("");

    try {
      const created = await createNotification(
        {
          ...form,
          recipient_role: "volunteer",
        },
        { broadcastToVolunteers: true },
      );
      setNotifications((current) => [...created, ...current]);
      setForm(emptyForm);
      setMessage(
        form.type === "emergency"
          ? "Emergency broadcast sent to volunteers."
          : "Announcement sent to volunteers.",
      );
    } catch (err) {
      setError(err.message || "Unable to send notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Manager Broadcasts</p>
            <h2 className="mt-1 text-2xl font-semibold">Notification Center</h2>
          </div>
          <Badge>{notifications.length} sent</Badge>
        </div>
      </section>

      {message ? <Alert>{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <form className="grid gap-4 rounded-md border border-border bg-card p-5" onSubmit={handleSend}>
        <div>
          <p className="text-sm font-semibold text-primary">Send Broadcast</p>
          <h3 className="mt-1 text-xl font-semibold">Announcement or Emergency Alert</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" id="title">
            <Input
              id="title"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </Field>

          <Field label="Type" id="type">
            <Select
              id="type"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="announcement">Announcement</option>
              <option value="emergency">Emergency Broadcast</option>
            </Select>
          </Field>

          <Field label="Zone" id="zone">
            <Select
              id="zone"
              value={form.zone}
              onChange={(event) => setForm((current) => ({ ...current, zone: event.target.value }))}
            >
              <option value="">All zones</option>
              {UJJAIN_ZONES.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Message" id="message">
          <textarea
            id="message"
            required
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={sending}>
            {sending ? "Sending..." : form.type === "emergency" ? "Send Emergency Broadcast" : "Send Announcement"}
          </Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border p-5">
          <h3 className="text-xl font-semibold">Notification History</h3>
          <p className="mt-1 text-sm text-muted-foreground">Newest notifications first.</p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading notification history...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6">
            <h4 className="text-lg font-semibold">No notifications sent yet</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Broadcasts and system-generated alerts will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border bg-muted/70 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Zone</th>
                  <th className="px-4 py-3 font-semibold">Recipient</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="mt-1 max-w-lg text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={typeTone(notification.type)}>{notification.type}</Badge>
                    </td>
                    <td className="px-4 py-4">{notification.zone || "All zones"}</td>
                    <td className="px-4 py-4">
                      {notification.recipient_user_id ? "Specific volunteer" : notification.recipient_role || "Any"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={notification.is_read ? "approved" : "pending"}>
                        {notification.is_read ? "read" : "unread"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">{formatDate(notification.created_at)}</td>
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

function Field({ label, id, children }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Select({ className = "", ...props }) {
  return (
    <select
      className={`h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${className}`}
      {...props}
    />
  );
}

function typeTone(type) {
  if (type === "emergency") return "rejected";
  if (type === "simulation") return "pending";
  if (type === "assignment") return "info";
  if (type === "approval") return "approved";
  return "neutral";
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
