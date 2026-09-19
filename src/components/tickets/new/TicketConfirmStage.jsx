'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CheckIcon } from '@/components/icons';

/** Stage 3: receipt for the ticket that was just filed. */
export default function TicketConfirmStage({ ticketId, onTrack, onAnother }) {
  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <Card className="mt-6 px-6 py-[54px] text-center">
        <div
          className="mx-auto mb-5 flex h-15 w-15 items-center justify-center rounded-full
            bg-low-soft text-low"
        >
          <CheckIcon size={26} />
        </div>
        <h2 className="mb-2 text-[22px] font-extrabold">แจ้งปัญหาเรียบร้อยแล้ว</h2>
        <p className="mb-1 text-ink-soft">
          ทีม IT ได้รับเรื่องของคุณแล้ว และจะรีบดำเนินการให้เร็วที่สุด
        </p>
        <div
          className="my-3.5 mb-[26px] inline-block rounded-s bg-indigo-soft px-4 py-2
            font-mono text-lg font-semibold text-indigo-dark"
        >
          {ticketId}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button onClick={onTrack}>ดูสถานะเรื่องนี้</Button>
          <Button variant="ghost" onClick={onAnother}>
            แจ้งปัญหาอื่นเพิ่ม
          </Button>
        </div>
      </Card>
    </div>
  );
}
