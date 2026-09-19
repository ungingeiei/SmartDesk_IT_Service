/** Heading + grey body block used for "รายละเอียดที่แจ้ง" and "สรุปวิธีแก้ไข". */
export default function TicketSection({ title, children, plain = false }) {
  return (
    <div className="mb-6">
      <h4 className="mb-2.5 text-md2 font-bold">{title}</h4>
      {plain ? (
        children
      ) : (
        <div className="rounded-s bg-surface-alt px-4 py-3.5 text-md text-ink-soft">{children}</div>
      )}
    </div>
  );
}
