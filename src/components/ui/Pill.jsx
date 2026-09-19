// A rounded-full label. Every badge in the design (priority, status, SLA, role,
// category) is one of these with a different colour pair.

const TONES = {
  category: 'bg-indigo-soft text-indigo-dark',
  neutral: 'bg-surface-alt text-ink-soft border border-line',
  mint: 'bg-mint-soft text-mint',
  critical: 'bg-critical-soft text-critical',
  low: 'bg-low-soft text-low',
};

export default function Pill({ tone = 'neutral', colors, className = '', children, ...rest }) {
  // `colors` lets callers pass the {bg, color} pairs that come out of the data
  // tables (PRIORITY_META, STATUS_META, slaInfo) rather than a named tone.
  const style = colors ? { background: colors.bg, color: colors.color } : undefined;

  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full font-bold whitespace-nowrap
        ${colors ? '' : TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
