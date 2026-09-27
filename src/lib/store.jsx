'use client';

// In-memory app state. The design has no backend, so everything the demo mutates
// lives here. Only state that must survive a route change belongs in this store —
// search boxes, form fields and filters stay local to their page.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { ASSIGNEES, USERS, defaultKB, defaultTickets } from './data';
import { calcPriority, formatThaiDateTime, formatThaiTime, guessAiSuggestion, guessCategory } from './logic';

const AppContext = createContext(null);

// Key the session is cached under in localStorage, so a page refresh doesn't
// bounce a signed-in user back to the login screen.
const SESSION_KEY = 'smartdesk.currentUser';

const initialState = {
  currentUser: null,
  // False until the localStorage check below has run once — RequireAuth must
  // not redirect to /login before it knows whether a session was restored.
  authReady: false,
  users: USERS.map((u) => ({ ...u })),
  kb: defaultKB(),
  tickets: defaultTickets(),
  ticketCounter: 102,
  deflectedCount: 132,
  fbChoice: {},
  toastMsg: null,
};

/** Apply `patch` to one ticket, leaving the rest of the list untouched. */
function patchTicket(tickets, id, patch) {
  return tickets.map((t) => (t.id === id ? { ...t, ...patch(t) } : t));
}

function patchArticle(kb, id, patch) {
  return kb.map((a) => (a.id === id ? { ...a, ...patch(a) } : a));
}

function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return { ...state, currentUser: action.user };

    case 'logout':
      return { ...state, currentUser: null };

    // Fired once on mount after checking localStorage for a saved session —
    // action.user is the restored user, or null if there wasn't one.
    case 'authReady':
      return { ...state, currentUser: action.user, authReady: true };

    // Replaces the mock tickets/kb/users with what /api/tickets, /api/kb and
    // /api/users returned, once they've loaded from the real database.
    case 'hydrate':
      return { ...state, ...action.payload };

    case 'toast':
      return { ...state, toastMsg: action.msg };

    case 'addUser':
      return { ...state, users: [...state.users, action.user] };

    // action.users is one or more full user rows straight back from the API
    // (PATCH /api/users/[code]) — replace each matching local row with it.
    case 'updateUsers': {
      const byCode = new Map(action.users.map((u) => [u.code, u]));
      return {
        ...state,
        users: state.users.map((u) => byCode.get(u.code) ?? u),
      };
    }

    case 'setFeedback':
      return {
        ...state,
        fbChoice: { ...state.fbChoice, [action.articleId]: action.choice },
      };

    case 'addArticle':
      return { ...state, kb: [action.article, ...state.kb] };

    case 'addComment':
      return {
        ...state,
        kb: patchArticle(state.kb, action.articleId, (a) => ({
          comments: [...a.comments, action.comment],
        })),
      };

    case 'acceptComment':
      return {
        ...state,
        kb: patchArticle(state.kb, action.articleId, (a) => ({
          comments: a.comments.map((c) => ({ ...c, accepted: c.id === action.commentId })),
        })),
      };

    case 'addTicket':
      return {
        ...state,
        tickets: [action.ticket, ...state.tickets],
        ticketCounter: state.ticketCounter + 1,
      };

    case 'patchTicket':
      return { ...state, tickets: patchTicket(state.tickets, action.id, action.patch) };

    case 'incrementDeflected':
      return { ...state, deflectedCount: state.deflectedCount + 1 };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef(null);

  // Restores the signed-in user from localStorage once per app load, so a
  // page refresh doesn't bounce the user back to the login screen.
  useEffect(() => {
    let storedUser = null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) storedUser = JSON.parse(raw);
    } catch {
      storedUser = null;
    }
    dispatch({ type: 'authReady', user: storedUser });
  }, []);

  // Once signed in, swap the mock tickets/kb/users for what's actually in the
  // database. Falls back to silently keeping the mock data if the fetch fails.
  useEffect(() => {
    if (!state.currentUser) return;
    let cancelled = false;

    async function hydrate() {
      try {
        const [tickets, kb, users, deflections] = await Promise.all([
          fetch('/api/tickets').then((r) => r.json()),
          fetch('/api/kb').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
          fetch('/api/kb-deflections').then((r) => r.json()),
        ]);
        if (cancelled) return;

        const ticketCounter = tickets.reduce((max, t) => {
          const n = Number(String(t.id).replace(/\D/g, ''));
          return Number.isFinite(n) ? Math.max(max, n + 1) : max;
        }, 102);

        dispatch({
          type: 'hydrate',
          payload: { tickets, kb, users, ticketCounter, deflectedCount: deflections.count },
        });
      } catch (err) {
        console.error('Failed to load data from the database, keeping demo data.', err);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [state.currentUser]);

  const showToast = useCallback((msg) => {
    dispatch({ type: 'toast', msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'toast', msg: null }), 2200);
  }, []);

  // Actions mirror the design's component methods one for one.
  const actions = useMemo(() => {
    /** Assignee record for the signed-in agent, matched by name as the design does. */
    const meAsAssignee = (user) => ({
      name: user.name,
      code: user.code || (ASSIGNEES.find((a) => a.name === user.name) || {}).code || '—',
    });

    return {
      /** `user` is whatever /api/auth/login returned — no pwd_hash included. */
      login: (user) => {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        } catch {
          // Private browsing / storage disabled — session just won't survive a refresh.
        }
        dispatch({ type: 'login', user });
      },

      logout: () => {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          // Nothing to clean up if storage was never written.
        }
        showToast('ออกจากระบบเรียบร้อยแล้ว');
        dispatch({ type: 'logout' });
      },

      /** Persists via POST /api/users, then adds the real row (with its DB id) to state. */
      addUser: async ({ code, name, email, title, role, password }) => {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, email, title, role, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'เพิ่มผู้ใช้ไม่สำเร็จ');
          throw new Error(data.error || 'เพิ่มผู้ใช้ไม่สำเร็จ');
        }

        dispatch({ type: 'addUser', user: data });
        showToast(`เพิ่มผู้ใช้ ${data.name} เรียบร้อยแล้ว`);
      },

      /** Persists via PATCH /api/users/[code] — patch can include name/email/title/role/status. */
      updateUser: async (code, patch) => {
        const res = await fetch(`/api/users/${encodeURIComponent(code)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ');
          throw new Error(data.error || 'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ');
        }

        dispatch({ type: 'updateUsers', users: [data] });
        showToast('บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว');
      },

      setUsersStatus: async (codes, status) => {
        const results = await Promise.all(
          codes.map((code) =>
            fetch(`/api/users/${encodeURIComponent(code)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
            }).then((r) => r.json()),
          ),
        );
        dispatch({ type: 'updateUsers', users: results });
        showToast(
          status === 'locked'
            ? `ล็อกบัญชี ${codes.length} รายการแล้ว`
            : `ปลดล็อกบัญชี ${codes.length} รายการแล้ว`,
        );
      },

      /** Admin-initiated reset — reuses the same endpoint the "forgot password" flow calls. */
      resetPassword: async (user, password) => {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username, newPassword: password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
          throw new Error(data.error || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
        }

        showToast(`ตั้งรหัสผ่านใหม่ให้ ${user.name} เรียบร้อยแล้ว`);
      },

      setFeedback: (articleId, choice) => dispatch({ type: 'setFeedback', articleId, choice }),

      /** Persists via POST /api/kb-deflections; increments immediately, doesn't wait on it. */
      incrementDeflected: (kbId, user) => {
        dispatch({ type: 'incrementDeflected' });
        fetch('/api/kb-deflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kbId, userId: user?.id }),
        }).catch((err) => console.error('Failed to record deflection', err));
      },

      /** Persists to the database via POST /api/kb, then adds the real row to state. */
      addArticle: async ({ title, cat, step }) => {
        const res = await fetch('/api/kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, cat, step }),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'เพิ่มบทความไม่สำเร็จ');
          throw new Error(data.error || 'เพิ่มบทความไม่สำเร็จ');
        }

        dispatch({ type: 'addArticle', article: data });
        showToast('เพิ่มบทความเรียบร้อยแล้ว');
      },

      /** Persists via POST /api/kb/[id]/comments, then adds the real row to state. */
      addComment: async (articleId, user, txt) => {
        const res = await fetch(`/api/kb/${articleId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, authorName: user.name, comment: txt }),
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'ส่งความคิดเห็นไม่สำเร็จ');
          throw new Error(data.error || 'ส่งความคิดเห็นไม่สำเร็จ');
        }

        dispatch({ type: 'addComment', articleId, comment: data });
      },

      acceptComment: async (articleId, commentId) => {
        const res = await fetch(`/api/kb/${articleId}/comments/${commentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accepted: true }),
        });

        if (!res.ok) {
          showToast('ทำเครื่องหมายคำตอบไม่สำเร็จ');
          return;
        }

        dispatch({ type: 'acceptComment', articleId, commentId });
        showToast('ทำเครื่องหมายคำตอบนี้ว่าดีที่สุดแล้ว');
      },

      /** Returns the new ticket id so the wizard can show its confirmation. */
      submitTicket: ({ kb, user, counter, title, desc, impact, urgency }) => {
        const now = new Date();
        const id = `TK-${counter}`;
        dispatch({
          type: 'addTicket',
          ticket: {
            id,
            title: title.trim(),
            desc: desc.trim(),
            impact,
            urgency,
            priority: calcPriority(impact, urgency),
            status: 'new',
            cat: guessCategory(kb, `${title} ${desc}`),
            created: formatThaiDateTime(now),
            createdAt: now.getTime(),
            reporter: user.name,
            assignee: null,
            chat: [],
            internalNotes: [],
            resolutionSummary: null,
            resolvedAt: null,
            csat: null,
            confirmed: false,
            reopenedCount: 0,
            aiSuggestion: guessAiSuggestion(kb, title, desc),
          },
        });
        return id;
      },

      claimTicket: (id, user, message) => {
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            assignee: meAsAssignee(user),
            status: t.status === 'new' ? 'in_progress' : t.status,
          }),
        });
        showToast(message ?? `รับเรื่อง ${id} เรียบร้อยแล้ว`);
      },

      setTicketStatus: (id, status) =>
        dispatch({ type: 'patchTicket', id, patch: () => ({ status }) }),

      reopenTicket: (id) =>
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            status: 'in_progress',
            reopenedCount: (t.reopenedCount || 0) + 1,
            confirmed: false,
          }),
        }),

      resolveTicket: (id, user, summary) => {
        const when = formatThaiTime(new Date());
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            resolutionSummary: summary,
            status: 'resolved',
            resolvedAt: Date.now(),
            chat: [
              ...t.chat,
              {
                who: user.name,
                staff: true,
                when,
                txt: `แก้ไขปัญหาเรียบร้อยแล้วครับ/ค่ะ สรุป: ${summary}`,
              },
            ],
          }),
        });
        showToast('บันทึกการแก้ไขแล้ว รอผู้ใช้ยืนยัน');
      },

      addInternalNote: (id, user, txt) =>
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            internalNotes: [
              ...t.internalNotes,
              { who: user.name, when: formatThaiTime(new Date()), txt },
            ],
          }),
        }),

      sendChat: (id, user, txt, staff) =>
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            chat: [
              ...t.chat,
              { who: user.name, staff, when: formatThaiTime(new Date()), txt },
            ],
          }),
        }),

      /**
       * The reporter confirms the fix. This closes the ticket and, as in the
       * design, folds its resolution summary into a new knowledge-base article.
       */
      confirmFixedYes: (ticket, kb) => {
        dispatch({
          type: 'patchTicket',
          id: ticket.id,
          patch: () => ({ status: 'closed', confirmed: true }),
        });
        if (ticket.resolutionSummary && !kb.some((k) => k.fromTicket === ticket.id)) {
          dispatch({
            type: 'addArticle',
            article: {
              id: 'kb-auto-' + ticket.id,
              cat: ticket.cat,
              title: `วิธีแก้: ${ticket.title}`,
              summary: ticket.resolutionSummary.slice(0, 70),
              updated: 'วันนี้',
              views: 0,
              tags: [ticket.title.toLowerCase()],
              steps: [ticket.resolutionSummary],
              comments: [],
              fromTicket: ticket.id,
            },
          });
        }
        showToast('ปิดงานเรียบร้อย ขอบคุณสำหรับการยืนยัน');
      },

      confirmFixedNo: (id) => {
        dispatch({
          type: 'patchTicket',
          id,
          patch: (t) => ({
            status: 'in_progress',
            reopenedCount: (t.reopenedCount || 0) + 1,
          }),
        });
        showToast('เปิดเรื่องนี้อีกครั้งให้ทีม IT ดูต่อแล้ว');
      },

      setCsat: (id, csat) => dispatch({ type: 'patchTicket', id, patch: () => ({ csat }) }),

      showToast,
    };
  }, [showToast]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}