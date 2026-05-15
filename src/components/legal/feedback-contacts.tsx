import { FEEDBACK_CONTACTS } from "@/lib/site-contacts";

const linkClass =
  "text-[color:var(--color-accent)] underline-offset-2 hover:underline break-all";

export function FeedbackContacts() {
  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">Вопросы и предложения</p>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {FEEDBACK_CONTACTS.map(({ email }) => (
          <li key={email}>
            <a href={`mailto:${email}`} className={linkClass}>
              {email}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
