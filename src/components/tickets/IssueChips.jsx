'use client';

/** "Common problems" quick picks on the self-service stage of the ticket wizard. */
export default function IssueChips({ issues, activeTitle, onPick }) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {issues.map((issue) => {
        const active = activeTitle === issue.title;
        return (
          <button
            key={issue.id}
            type="button"
            onClick={() => onPick(issue)}
            aria-pressed={active}
            className={`cursor-pointer rounded-full border px-[18px] py-[11px] text-md
              font-semibold transition hover:-translate-y-0.5 hover:shadow-card active:scale-95
              ${
                active
                  ? 'border-mint bg-mint-soft text-mint'
                  : 'border-line bg-surface text-ink-soft hover:border-mint hover:text-mint'
              }`}
          >
            {issue.title}
          </button>
        );
      })}
    </div>
  );
}
