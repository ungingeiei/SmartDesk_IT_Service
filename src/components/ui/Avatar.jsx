// Monogram circle. The design uses three sizes and two tones.

const SIZES = {
  32: 'w-8 h-8 text-xs2',
  34: 'w-[34px] h-[34px] text-sm2',
  44: 'w-11 h-11 text-xl',
};

const TONES = {
  indigo: 'bg-indigo-soft text-indigo-dark',
  muted: 'bg-surface-alt text-ink-soft',
};

export default function Avatar({ initial, size = 34, tone = 'indigo', className = '' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold
        ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {initial}
    </div>
  );
}
