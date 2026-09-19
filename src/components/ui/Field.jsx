// Labelled text input / textarea for the ticket form.

const CONTROL = `w-full rounded-s border border-line bg-surface-alt px-[13px] py-[11px]
  text-md2 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-indigo`;

export function Field({ label, children }) {
  return (
    <div className="mb-[18px]">
      <label className="mb-[7px] block text-md font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ className = '', ...rest }) {
  return <input type="text" className={`${CONTROL} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }) {
  return <textarea className={`${CONTROL} min-h-24 resize-y ${className}`} {...rest} />;
}
