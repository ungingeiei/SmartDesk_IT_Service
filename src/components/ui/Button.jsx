const VARIANTS = {
  // Filled indigo — the main call to action.
  solid: 'border-none bg-indigo text-white hover:bg-indigo-dark disabled:bg-indigo-muted',
  // Outlined, used beside a solid button.
  ghost: 'border border-line bg-transparent text-indigo-dark hover:bg-indigo-soft',
  // White on the indigo CTA band.
  white: 'border-none bg-white text-indigo-dark hover:opacity-90',
  // Neutral pill used by the agent's status controls.
  neutral: 'border border-line bg-surface text-ink hover:border-indigo',
};

const SIZES = {
  sm: 'text-sm2 px-4 py-2',
  md: 'text-md2 px-[22px] py-3',
};

export default function Button({
  variant = 'solid',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition
        active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
