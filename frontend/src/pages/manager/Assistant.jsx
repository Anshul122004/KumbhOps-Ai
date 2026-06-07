import { useState } from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { answerOperationalQuestion } from "../../services/assistantService";

const suggestedQuestions = [
  "How many approved volunteers?",
  "How many active emergencies?",
  "Which zone is most at risk?",
  "Give operational recommendations.",
  "Show assignment statistics.",
];

export function Assistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await askQuestion(question);
  }

  async function askQuestion(value) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "manager",
      content: trimmed,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const answer = await answerOperationalQuestion(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          createdAt: new Date(),
        },
      ]);
    } catch (err) {
      setError(err.message || "Assistant could not answer that question.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Command Assistant</p>
            <h2 className="mt-1 text-2xl font-semibold">AI Operations Assistant</h2>
          </div>
          <Badge variant="info">deterministic</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Ask operational questions based on live KumbhOps data. No external AI API is used.
        </p>
      </section>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <section className="rounded-md border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Suggested Questions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((item) => (
            <Button
              key={item}
              variant="outline"
              disabled={loading}
              onClick={() => askQuestion(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid max-h-[560px] gap-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading ? (
              <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                Assistant is analyzing operations data...
              </div>
            ) : null}
          </div>
        )}

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            value={question}
            placeholder="Ask about volunteers, emergencies, assignments, simulations..."
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button className="sm:w-32" type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function MessageBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={`rounded-md border p-4 ${
        isAssistant ? "border-border bg-background" : "border-primary/20 bg-primary/5"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant={isAssistant ? "info" : "neutral"}>
          {isAssistant ? "Assistant" : "Manager"}
        </Badge>
        <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
      </div>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
        {message.content}
      </pre>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-border bg-background p-6">
      <h3 className="text-lg font-semibold">Ask a question about operations</h3>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
        <span>Volunteers</span>
        <span>Assignments</span>
        <span>Emergencies</span>
        <span>Simulations</span>
        <span>Notifications</span>
        <span>Zone Risks</span>
        <span>Recommendations</span>
      </div>
    </div>
  );
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
