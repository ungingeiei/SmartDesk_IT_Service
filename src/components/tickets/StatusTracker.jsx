import { STATUS_META, STEP_LABELS } from '@/lib/data';

/** Four-node progress rail across the top of an employee's ticket detail. */
export default function StatusTracker({ status }) {
  const currentStep = STATUS_META[status]?.step ?? 0;

  return (
    <div className="mb-7 flex items-start">
      {STEP_LABELS.map((label, i) => {
        const isCurrent = i === currentStep;
        const isReached = i <= currentStep;
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <div key={label} className="relative flex flex-1 flex-col items-center">
            {isLast ? null : (
              <div
                aria-hidden="true"
                className={`absolute top-[15px] left-1/2 z-0 h-1 w-full rounded-full
                  ${i < currentStep ? 'bg-indigo' : 'bg-line'}`}
              />
            )}
            <div
              className={`relative z-[1] flex h-[34px] w-[34px] items-center justify-center
                rounded-full text-md font-bold
                ${isCurrent ? 'bg-ink text-white' : 'bg-surface-alt text-ink-faint'}`}
            >
              {i + 1}
            </div>
            <div
              className={`mt-2 text-center text-xs2
                ${isReached ? 'font-semibold text-ink' : 'text-ink-faint'}`}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
