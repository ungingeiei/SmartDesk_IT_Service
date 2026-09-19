'use client';

import { IMPACT_OPTS, PRIORITY_META, URGENCY_OPTS } from '@/lib/data';
import { calcPriority } from '@/lib/logic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import OptionCard from '@/components/ui/OptionCard';
import { Field, TextArea, TextInput } from '@/components/ui/Field';

/** Stage 2: the actual report. Priority is derived live from impact x urgency. */
export default function TicketFormStage({ form, onChange, onBack, onSubmit }) {
  const priority = form.impact && form.urgency ? calcPriority(form.impact, form.urgency) : null;
  const meta = priority ? PRIORITY_META[priority] : null;
  const canSubmit = Boolean(form.title.trim() && form.desc.trim() && form.impact && form.urgency);

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-[70px]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent
          pt-6 pb-1.5 text-md font-semibold text-ink-soft hover:text-indigo-dark"
      >
        ← กลับไปค้นหา
      </button>

      <div className="pt-3 pb-[30px]">
        <h1 className="m-0 text-[32px] font-extrabold">แจ้งปัญหาใหม่</h1>
      </div>

      <Card>
        <p className="mb-[22px] text-md2 text-ink-soft">
          บอกเราหน่อยว่าเจอปัญหาอะไร ระบบจะช่วยประเมินระดับความเร่งด่วนให้อัตโนมัติ
        </p>

        <Field label="หัวข้อปัญหา">
          <TextInput
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="เช่น ปริ้นเตอร์ชั้น 3 ใช้งานไม่ได้"
          />
        </Field>

        <Field label="รายละเอียด">
          <TextArea
            value={form.desc}
            onChange={(e) => onChange({ desc: e.target.value })}
            placeholder="อธิบายปัญหาที่เจอ เช่น เกิดขึ้นตอนไหน มีข้อความ error อะไรขึ้นบ้าง"
          />
        </Field>

        <Field label="ผลกระทบ (Impact)">
          <div className="grid grid-cols-3 gap-2 max-[600px]:grid-cols-1">
            {IMPACT_OPTS.map((option) => (
              <OptionCard
                key={option.v}
                selected={form.impact === option.v}
                onClick={() => onChange({ impact: option.v })}
              >
                {option.label}
              </OptionCard>
            ))}
          </div>
        </Field>

        <Field label="ความเร่งด่วน (Urgency)">
          <div className="grid grid-cols-3 gap-2 max-[600px]:grid-cols-1">
            {URGENCY_OPTS.map((option) => (
              <OptionCard
                key={option.v}
                selected={form.urgency === option.v}
                onClick={() => onChange({ urgency: option.v })}
              >
                {option.label}
              </OptionCard>
            ))}
          </div>
        </Field>

        <div className="mt-[22px] flex items-center gap-3.5 rounded-m bg-surface-alt px-[18px] py-4">
          {meta ? (
            <>
              <Pill colors={meta} className="px-[13px] py-1.5 text-sm2">
                {meta.label}
              </Pill>
              <span className="text-base text-ink-soft">
                <strong className="mb-0.5 block text-md2 text-ink">ระดับความสำคัญที่คำนวณได้</strong>
                ประเมินจากผลกระทบและความเร่งด่วนที่คุณเลือก
              </span>
            </>
          ) : (
            <span className="text-base text-ink-faint">
              เลือก Impact และ Urgency ให้ครบ เพื่อดูระดับความสำคัญ
            </span>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button onClick={onSubmit} disabled={!canSubmit}>
            ส่งเรื่อง
          </Button>
        </div>
      </Card>
    </div>
  );
}
