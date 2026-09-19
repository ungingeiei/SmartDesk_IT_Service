'use client';

import { useState } from 'react';
import { initialOf } from '@/lib/logic';
import Avatar from '@/components/ui/Avatar';
import SendButton from '@/components/ui/SendButton';

/**
 * Conversation between the reporter and the IT team.
 *
 * `viewerIsReporter` only changes the avatar monogram: the reporter sees their
 * own messages as "คุณ", an agent sees the reporter's initial.
 */
export default function ChatThread({ title, messages, canSend, placeholder, onSend, viewerIsReporter }) {
  return (
    <div className="mb-6">
      <h4 className="mb-2.5 text-md2 font-bold">{title}</h4>

      {messages.length === 0 ? (
        <div className="pt-1.5 pb-3.5 text-base text-ink-faint">ยังไม่มีข้อความ</div>
      ) : (
        messages.map((message, i) => (
          <div key={i} className="mb-3.5 flex gap-2.5">
            <Avatar
              size={32}
              tone={message.staff ? 'muted' : 'indigo'}
              initial={message.staff ? 'IT' : viewerIsReporter ? 'คุณ' : initialOf(message.who)}
            />
            <div className="text-base">
              <span className="mr-2 font-bold">{message.who}</span>
              <span className="text-xs text-ink-faint">{message.when}</span>
              <div className="mt-[3px] text-ink-soft">{message.txt}</div>
            </div>
          </div>
        ))
      )}

      {canSend ? <ChatComposer placeholder={placeholder} onSend={onSend} /> : null}
    </div>
  );
}

function ChatComposer({ placeholder, onSend }) {
  const [text, setText] = useState('');

  function handleSend() {
    const txt = text.trim();
    if (!txt) return;
    onSend(txt);
    setText('');
  }

  return (
    <div className="mt-3.5 flex gap-2.5">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-line bg-surface-alt px-4 py-[11px]
          text-md text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-indigo"
      />
      <SendButton onClick={handleSend} disabled={!text.trim()} />
    </div>
  );
}
