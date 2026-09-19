/** Horizontal bar in the dashboard's volume panels. `ratio` is 0–1. */
export default function BarRow({ label, value, ratio }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="w-[130px] shrink-0 text-base text-ink-soft max-[600px]:w-[90px] max-[600px]:text-xs2">
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full rounded-full bg-indigo" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="w-[34px] shrink-0 text-right text-sm2 font-bold text-ink">{value}</span>
    </div>
  );
}
