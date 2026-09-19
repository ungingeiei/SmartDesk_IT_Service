export default function DashPanel({ title, children, className = '' }) {
  return (
    <div className={`mb-[18px] rounded-m border border-line bg-surface px-[22px] py-5 ${className}`}>
      <h3 className="mb-4 text-lg2 font-bold">{title}</h3>
      {children}
    </div>
  );
}
