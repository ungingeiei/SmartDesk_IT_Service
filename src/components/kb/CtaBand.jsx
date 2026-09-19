import Link from 'next/link';

/** "Didn't find what you need?" band shown to employees below the article grid. */
export default function CtaBand() {
  return (
    <div
      className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-l bg-indigo-dark
        px-7 py-6 text-white max-[600px]:flex-col max-[600px]:items-start"
    >
      <div>
        <h3 className="mb-1 text-[17px] font-bold">ไม่เจอคำตอบที่ต้องการใช่ไหม</h3>
        <p className="m-0 text-base text-[#D9D6FA]">
          แจ้งปัญหาให้ทีม IT ช่วยดูได้เลย ใช้เวลาไม่ถึง 1 นาที
        </p>
      </div>
      <Link
        href="/tickets/new"
        className="rounded-full bg-white px-[22px] py-3 text-md2 font-bold text-indigo-dark
          transition hover:opacity-90 active:scale-[0.97]"
      >
        แจ้งปัญหาใหม่
      </Link>
    </div>
  );
}
