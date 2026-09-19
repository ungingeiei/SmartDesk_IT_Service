'use client';

/** Satisfaction rating, collected after the reporter confirms the fix. */
export default function CsatStars({ value, onRate }) {
  if (value) {
    return (
      <div className="my-4 text-center">
        <span className="text-base font-bold text-low">ขอบคุณสำหรับคะแนน {value}/5 ดาว</span>
      </div>
    );
  }

  return (
    <div className="my-4 text-center">
      <p className="mb-2 font-semibold">ให้คะแนนความพึงพอใจการแก้ไขปัญหาครั้งนี้</p>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`ให้คะแนน ${n} ดาว`}
            className="cursor-pointer border-none bg-transparent p-0.5 text-[26px] leading-none
              text-line transition-colors hover:text-[#F5A623]"
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
