// Selectable tile for the Impact / Urgency pickers on the ticket form.

export default function OptionCard({ selected, children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`cursor-pointer rounded-s border-[1.5px] px-2.5 py-3 text-center text-base
        font-semibold transition active:scale-95
        disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100
        ${
          selected
            ? 'border-indigo bg-indigo-soft text-indigo-dark'
            : 'border-line bg-surface-alt text-ink-soft hover:border-indigo'
        }`}
      {...rest}
    >
      {children}
    </button>
  );
}