// Left-aligned screen title with a count underneath (queue, my tickets, dashboard).

export default function PageHeading({ title, subtitle, size = 'md', className = '' }) {
  return (
    <div className={`pt-9 pb-1.5 ${className}`}>
      <h1
        className={`mb-1 font-extrabold tracking-[-0.02em]
          ${size === 'lg' ? 'text-[32px]' : 'text-[30px]'} max-[600px]:text-[26px]`}
      >
        {title}
      </h1>
      {subtitle ? <p className="m-0 text-md text-ink-faint">{subtitle}</p> : null}
    </div>
  );
}
