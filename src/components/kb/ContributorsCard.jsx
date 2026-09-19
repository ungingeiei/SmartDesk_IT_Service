import { CONTRIBUTORS } from '@/lib/data';
import Avatar from '@/components/ui/Avatar';

export default function ContributorsCard() {
  return (
    <div className="rounded-m border border-line bg-surface p-5 shadow-card">
      <h4 className="mb-3.5 text-center text-sm2 tracking-[0.04em] text-ink-faint uppercase">
        ผู้ร่วมแบ่งปันความรู้
        <br />3 อันดับแรก
      </h4>
      {CONTRIBUTORS.map((person) => (
        <div key={person.name} className="flex items-center gap-2.5 py-1.5">
          <Avatar initial={person.initial} size={32} className="text-sm2" />
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-ink">{person.name}</div>
            <div className="text-xs text-ink-faint">{person.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
