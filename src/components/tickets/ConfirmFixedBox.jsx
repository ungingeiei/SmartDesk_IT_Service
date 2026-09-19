import Button from '@/components/ui/Button';

/** Shown to the reporter once IT marks a ticket resolved. */
export default function ConfirmFixedBox({ onYes, onNo }) {
  return (
    <div className="my-4 rounded-m bg-surface-alt px-[18px] py-4 text-center">
      <p className="mb-3 font-semibold">ทีม IT แจ้งว่าแก้ไขปัญหาแล้ว — ปัญหาของคุณหายหรือยัง?</p>
      <div className="flex justify-center gap-2.5">
        <Button size="sm" onClick={onYes}>
          หายแล้ว ✓
        </Button>
        <Button size="sm" variant="ghost" onClick={onNo}>
          ยังไม่หาย
        </Button>
      </div>
    </div>
  );
}
