// Labelled text input / textarea / select for the ticket and user forms.

const CONTROL = `w-full rounded-s border border-line bg-surface-alt px-[13px] py-[11px]
  text-md2 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-indigo
  disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-critical`;

/**
 * `htmlFor` ties the label to its control (pass the control's id); `hint` and `error`
 * render beneath it. All three are optional, so the ticket form keeps working as before.
 */
export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="mb-[18px]">
      <label htmlFor={htmlFor} className="mb-[7px] block text-md font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 mb-0 text-sm2 text-critical">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 mb-0 text-sm2 text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className = '', ...rest }) {
  return <input type="text" className={`${CONTROL} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }) {
  return <textarea className={`${CONTROL} min-h-24 resize-y ${className}`} {...rest} />;
}

export function SelectInput({ className = '', ...rest }) {
  return <select className={`${CONTROL} cursor-pointer ${className}`} {...rest} />;
}