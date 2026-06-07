import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  listNotifications,
  markNotificationRead,
} from "../../services/notificationService";

export function VolunteerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState("");
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
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId) {
    setReadingId(notificationId);
    setError("");
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? updated : item)),
      );
    } catch (err) {
      setError(err.message || "Unable to mark notification as read.");
    } finally {
      setReadingId("");
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (loading) {
    return <PanelState message="Loading notifications..." />;
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Volunteer Alerts</p>
            <h2 className="mt-1 text-2xl font-semibold">Notification Center</h2>
          </div>
          <Badge variant={unreadCount ? "pending" : "neutral"}>{unreadCount} unread</Badge>
        </div>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      {notifications.length === 0 ? (
        <section className="rounded-md border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">No notifications yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Assignments, approvals, emergencies, announcements, and simulations will appear here.
          </p>
        </section>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-md border p-5 ${
                notification.type === "emergency"
                  ? "border-red-200 bg-red-50"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={typeTone(notification.type)}>{notification.type}</Badge>
                    {!notification.is_read ? <Badge variant="pending">unread</Badge> : null}
                    {notification.zone ? <Badge variant="neutral">{notification.zone}</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{notification.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                <Button
                  variant={notification.is_read ? "outline" : "primary"}
                  disabled={notification.is_read || readingId === notification.id}
                  onClick={() => handleMarkRead(notification.id)}
                >
                  {notification.is_read
                    ? "Read"
                    : readingId === notification.id
                      ? "Updating..."
                      : "Mark as Read"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function typeTone(type) {
  if (type === "emergency") return "rejected";
  if (type === "simulation") return "pending";
  if (type === "assignment") return "info";
  if (type === "approval") return "approved";
  return "neutral";
}

function PanelState({ message }) {
  return (
    <section className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
