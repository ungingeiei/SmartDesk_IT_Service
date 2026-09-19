import { SendIcon } from '@/components/icons';

export default function SendButton({ label = 'ส่ง', ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full
        border-none bg-indigo text-white transition-colors hover:bg-indigo-dark
        disabled:cursor-not-allowed disabled:opacity-50"
      {...rest}
    >
      <SendIcon size={18} />
    </button>
  );
}
