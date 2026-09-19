export default function StatCard({ label, value, note }) {
  return (
    <div className="rounded-m border border-line bg-surface p-[18px] shadow-card">
      <div className="mb-1.5 text-sm font-semibold text-ink-faint">{label}</div>
      <div className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">{value}</div>
      <div className="mt-1 text-xs text-ink-faint">{note}</div>
    </div>
  );
}
