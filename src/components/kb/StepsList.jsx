/**
 * Numbered how-to steps. Each marker is an indigo disc; a connecting rule runs
 * between consecutive markers, as in the prototype's ::after rule.
 */
export default function StepsList({ steps }) {
  return (
    <ol className="m-0 mb-[26px] list-none p-0">
      {steps.map((text, i) => (
        <li key={i} className="relative pb-[22px] pl-[38px] text-md2 last:pb-0">
          <span
            className="absolute -top-0.5 left-0 flex h-[26px] w-[26px] items-center justify-center
              rounded-full bg-indigo-soft text-sm2 font-bold text-indigo-dark"
          >
            {i + 1}
          </span>
          {i < steps.length - 1 ? (
            <span className="absolute top-6 bottom-0 left-[13px] w-0.5 bg-line" aria-hidden="true" />
          ) : null}
          {text}
        </li>
      ))}
    </ol>
  );
}
