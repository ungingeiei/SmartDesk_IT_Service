// The white panel every detail screen sits in.

export default function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`rounded-l border border-line bg-surface px-[34px] py-8 shadow-card
        max-[600px]:px-[18px] max-[600px]:py-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
