'use client';

import { SLA_HOURS, STATUS_META } from '@/lib/data';
import { useApp } from '@/lib/store';
import PageHeading from '@/components/ui/PageHeading';
import StatCard from '@/components/dashboard/StatCard';
import BarRow from '@/components/dashboard/BarRow';
import DashPanel from '@/components/dashboard/DashPanel';

export default function DashboardPage() {
  const { tickets, deflectedCount } = useApp();

  const total = tickets.length;
  const closed = tickets.filter(
    (t) => (t.status === 'resolved' || t.status === 'closed') && t.resolvedAt,
  );

  const avgResolutionHours = closed.length
    ? closed.reduce((sum, t) => sum + (t.resolvedAt - t.createdAt), 0) / closed.length / 3600000
    : 0;

  const withinSla = closed.filter(
    (t) => t.resolvedAt - t.createdAt <= (SLA_HOURS[t.priority] || 24) * 3600000,
  ).length;
  const slaRate = closed.length ? Math.round((withinSla / closed.length) * 100) : 100;

  // Share of problems solved via the knowledge base rather than a ticket.
  const deflectionRate = Math.round((deflectedCount / (deflectedCount + total)) * 100);

  const rated = tickets.filter((t) => t.csat);
  const avgCsat = rated.length
    ? (rated.reduce((sum, t) => sum + t.csat, 0) / rated.length).toFixed(1)
    : '—';

  const statusCounts = {};
  const volumeByCat = {};
  for (const ticket of tickets) {
    statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
    const cat = ticket.cat || 'อื่นๆ';
    volumeByCat[cat] = (volumeByCat[cat] || 0) + 1;
  }

  const maxVolume = Math.max(1, ...Object.values(volumeByCat));
  const maxStatus = Math.max(1, ...Object.values(statusCounts));
  const inFlight = (statusCounts.in_progress || 0) + (statusCounts.pending || 0);

  return (
    <div className="mx-auto max-w-[1080px] px-6 pb-[70px]">
      <PageHeading
        title="แดชบอร์ดหัวหน้าทีม IT"
        subtitle="ภาพรวมประสิทธิภาพของทีมและ Knowledge Hub"
      />

      <div className="mt-5 mb-7 grid grid-cols-4 gap-3.5 max-[820px]:grid-cols-2">
        <StatCard
          label="Ticket ทั้งหมด (เปิดอยู่)"
          value={total}
          note={`${statusCounts.new || 0} ใหม่ · ${inFlight} กำลังทำ`}
        />
        <StatCard
          label="เวลาแก้ไขเฉลี่ย"
          value={`${avgResolutionHours ? avgResolutionHours.toFixed(1) : '—'} ชม.`}
          note={`จาก ${closed.length} ticket ที่ปิดแล้ว`}
        />
        <StatCard label="SLA Compliance" value={`${slaRate}%`} note="ticket ที่ปิดภายในกำหนด SLA" />
        <StatCard
          label="Deflection Rate"
          value={`${deflectionRate}%`}
          note="แก้ปัญหาเองผ่าน Knowledge Hub โดยไม่ต้องเปิด ticket"
        />
      </div>

      <DashPanel title="ปริมาณ Ticket แยกตามหมวดหมู่">
        {Object.entries(volumeByCat)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => (
            <BarRow key={cat} label={cat} value={count} ratio={count / maxVolume} />
          ))}
      </DashPanel>

      <DashPanel title="สถานะ Ticket ปัจจุบัน">
        {Object.entries(statusCounts).map(([status, count]) => (
          <BarRow
            key={status}
            label={STATUS_META[status]?.label ?? status}
            value={count}
            ratio={count / maxStatus}
          />
        ))}
      </DashPanel>

      <DashPanel title="ความพึงพอใจของผู้ใช้ (CSAT)" className="mb-0">
        <p className="m-0 text-md text-ink-soft">
          คะแนนเฉลี่ย <strong className="text-[18px] text-ink">{avgCsat}</strong> / 5 จาก{' '}
          {rated.length} การให้คะแนน
        </p>
      </DashPanel>
    </div>
  );
}
