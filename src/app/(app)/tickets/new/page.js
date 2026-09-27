'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import TicketSearchStage from '@/components/tickets/new/TicketSearchStage';
import TicketFormStage from '@/components/tickets/new/TicketFormStage';
import TicketConfirmStage from '@/components/tickets/new/TicketConfirmStage';

/**
 * Reporting a problem is a three-step wizard, not three destinations, so the
 * stage is local state on one route — the same flow the design describes.
 * Each stage lives in its own component file.
 */
function NewTicketWizard() {
  const { kb, currentUser, submitTicket } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Arriving from an article's "this didn't help" button skips straight to the
  // form with the problem already described.
  const prefillTitle = searchParams.get('title') ?? '';
  const prefillDesc = searchParams.get('desc') ?? '';
  const prefilled = Boolean(prefillTitle || prefillDesc);

  const [stage, setStage] = useState(prefilled ? 'form' : 'search');
  const [query, setQuery] = useState('');
  const [submittedId, setSubmittedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: prefillTitle,
    desc: prefillDesc,
    impact: null,
    urgency: null,
  });

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function openForm() {
    // Carry the search text over as the ticket title if nothing is typed yet.
    if (query.trim() && !form.title.trim()) updateForm({ title: query.trim() });
    setStage('form');
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);

    // submitTicket now files the ticket via Prisma (POST /api/tickets/report)
    // and returns null if that request failed, in which case we stay on the
    // form instead of moving to a confirmation for a ticket that was never
    // actually created.
    const id = await submitTicket({ user: currentUser, ...form });
    setSubmitting(false);
    if (!id) return;

    setSubmittedId(id);
    setForm({ title: '', desc: '', impact: null, urgency: null });
    setStage('confirm');
  }

  function startAnother() {
    setSubmittedId(null);
    setQuery('');
    setStage('search');
  }

  if (stage === 'confirm') {
    return (
      <TicketConfirmStage
        ticketId={submittedId}
        onTrack={() => router.push(`/tickets/${submittedId}`)}
        onAnother={startAnother}
      />
    );
  }

  if (stage === 'form') {
    return (
      <TicketFormStage
        form={form}
        onChange={updateForm}
        onBack={() => setStage('search')}
        onSubmit={handleSubmit}
      />
    );
  }

  return <TicketSearchStage query={query} onQueryChange={setQuery} onOpenForm={openForm} />;
}

export default function NewTicketPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // out of static rendering.
  return (
    <Suspense>
      <NewTicketWizard />
    </Suspense>
  );
}
