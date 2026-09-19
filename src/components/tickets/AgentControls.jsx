'use client';

/**
 * The status buttons on the agent workspace. Which ones appear depends on where
 * the ticket is in its lifecycle — the same branching as the design's
 * `workButtons` list.
 */
export default function AgentControls({ status, onStatus, onOpenResolve, onReopen }) {
  const isOpen = status !== 'resolved' && status !== 'closed';

  const buttons = [];
  if (status === 'new') buttons.push({ label: 'เริ่มดำเนินการ', onClick: () => onStatus('in_progress') });
  if (status === 'in_progress') buttons.push({ label: 'รอข้อมูลจากผู้ใช้', onClick: () => onStatus('pending') });
  if (status === 'pending') buttons.push({ label: 'กลับมาดำเนินการ', onClick: () => onStatus('in_progress') });
  if (isOpen) buttons.push({ label: 'แก้ไขเสร็จแล้ว', onClick: onOpenResolve, primary: true });
  if (!isOpen) buttons.push({ label: 'เปิดเรื่องใหม่', onClick: onReopen });

  return (
    <div className="my-4 flex flex-wrap gap-2">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.onClick}
          className={`cursor-pointer rounded-full border px-[15px] py-[9px] text-sm2 font-bold
            transition-colors max-[600px]:flex-1 ${
              button.primary
                ? 'border-indigo bg-indigo text-white hover:bg-indigo-dark'
                : 'border-line bg-surface text-ink hover:border-indigo'
            }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
