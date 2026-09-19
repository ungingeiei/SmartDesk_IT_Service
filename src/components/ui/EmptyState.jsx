// Dashed placeholder shown when a list or search comes back empty.

export default function EmptyState({ icon, title, hint, className = '' }) {
  return (
    <div
      className={`rounded-m border border-dashed border-line bg-surface px-5 py-11
        text-center text-ink-soft ${className}`}
    >
      {icon ? <div className="mb-2.5 flex justify-center text-ink-faint">{icon}</div> : null}
      <div>{title}</div>
      {hint ? <div className="mt-1 text-sm2">{hint}</div> : null}
    </div>
  );
}
