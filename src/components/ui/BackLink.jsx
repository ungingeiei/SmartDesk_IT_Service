import Link from 'next/link';

export default function BackLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 pt-6 pb-1.5 text-md font-semibold
        text-ink-soft transition-colors hover:text-indigo-dark"
    >
      {children}
    </Link>
  );
}
