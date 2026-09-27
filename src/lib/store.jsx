'use client';

// In-memory app state. The design has no backend, so everything the demo mutates
// lives here. Only state that must survive a route change belongs in this store —
// search boxes, form fields and filters stay local to their page.

import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { USERS } from './data';
import { usernameFromCode } from './users';

const AppContext = createContext(null);

const initialState = {
  currentUser: null,
  users: USERS.map((u) => ({ ...u })),
  // Populated from the Prisma-backed APIs (see loadKB/loadTickets below) once
  // someone logs in — no longer seeded from the src/lib/data.js mock arrays.
  kb: [],
  tickets: [],
  deflectedCount: 132,
  fbChoice: {},
  toastMsg: null,
};

async function apiRequest(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
const postJSON = (url, body) => apiRequest('POST', url, body);
const putJSON = (url, body) => apiRequest('PUT', url, body);
const patchJSON = (url, body) => apiRequest('PATCH', url, body);

/** คลังความรู้ — same list for every role, so this always runs after login. */
async function loadKB(dispatch) {
  const { ok, data } = await postJSON('/api/kb');
  if (ok) dispatch({ type: 'setKB', kb: data.articles });
}

/**
 * ticket ของฉัน (employee) or คิวงาน / ticket ทั้งหมด (agent, admin) — which
 * endpoint depends on the signed-in role, same as the read-only tab each role
 * gets in src/lib/data.js's NAV.
 */
async function loadTickets(dispatch, user) {
  const isEmployee = user.role === 'employee';
  const { ok, data } = await postJSON(
    isEmployee ? '/api/tickets/mine' : '/api/tickets/queue',
    isEmployee ? { reporterId: user.id } : undefined,
  );
  if (ok) dispatch({ type: 'setTickets', tickets: data.tickets });
}

function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return { ...state, currentUser: action.user };

    case 'logout':
      return { ...state, currentUser: null };

    case 'toast':
      return { ...state, toastMsg: action.msg };

    case 'setKB':
      return { ...state, kb: action.kb };

    case 'setTickets':
      return { ...state, tickets: action.tickets };

    case 'addUser':
      return { ...state, users: [...state.users, action.user] };

    case 'patchUsers': {
      // The signed-in admin can never change their own role or lock themselves out.
      const selfCode = state.currentUser?.code;
      return {
        ...state,
        users: state.users.map((u) => {
          if (!action.codes.includes(u.code)) return u;
          const patch = u.code === selfCode ? { ...action.patch, role: u.role, status: u.status } : action.patch;
          return { ...u, ...patch };
        }),
      };
    }

    case 'setFeedback':
      return {
        ...state,
        fbChoice: { ...state.fbChoice, [action.articleId]: action.choice },
      };

    case 'addArticle':
      return { ...state, kb: [action.article, ...state.kb] };

    // Every KB mutation past creation (comments, accepting one) round-trips
    // through the API and comes back as the whole article, freshly mapped —
    // simplest way to stay in sync with whatever the server actually did.
    case 'setArticle':
      return { ...state, kb: state.kb.map((a) => (a.id === action.article.id ? action.article : a)) };

    case 'addTicket':
      return { ...state, tickets: [action.ticket, ...state.tickets] };

    // Same idea as setArticle, for every ticket-detail action (claim,
    // resolve, chat, notes, confirm, csat) — see api/tickets/[ticketNo].
    case 'setTicketRow':
      return {
        ...state,
        tickets: state.tickets.map((t) => (t.id === action.ticket.id ? action.ticket : t)),
      };

    case 'incrementDeflected':
      return { ...state, deflectedCount: state.deflectedCount + 1 };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    dispatch({ type: 'toast', msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: 'toast', msg: null }), 2200);
  }, []);

  // Actions mirror the design's component methods one for one.
  const actions = useMemo(() => {
    return {
      /**
       * `user` is whatever /api/auth/login returned — no pwd_hash included.
       * Signing in immediately queries the real KB + ticket data for this
       * role via Prisma, replacing what used to be the mock seed.
       */
      login: (user) => {
        dispatch({ type: 'login', user });
        loadKB(dispatch);
        loadTickets(dispatch, user);
      },

      logout: () => {
        showToast('ออกจากระบบเรียบร้อยแล้ว');
        dispatch({ type: 'logout' });
      },

      addUser: ({ code, name, email, title, role }) => {
        dispatch({
          type: 'addUser',
          user: {
            code: code.trim(),
            name: name.trim(),
            username: usernameFromCode(code),
            email: email.trim().toLowerCase(),
            title: title.trim(),
            role,
            status: 'active',
          },
        });
        showToast(`เพิ่มผู้ใช้ ${name.trim()} เรียบร้อยแล้ว`);
      },

      updateUser: (code, patch) => {
        dispatch({ type: 'patchUsers', codes: [code], patch });
        showToast('บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว');
      },

      setUsersStatus: (codes, status) => {
        dispatch({ type: 'patchUsers', codes, patch: { status } });
        showToast(status === 'locked' ? `ล็อกบัญชี ${codes.length} รายการแล้ว` : `ปลดล็อกบัญชี ${codes.length} รายการแล้ว`);
      },

      /**
       * Frontend stub: the password itself is deliberately not kept in state. The real
       * implementation must send it to the API, which hashes it before it reaches `pwd_hash`.
       */
      resetPassword: (user) => showToast(`ตั้งรหัสผ่านใหม่ให้ ${user.name} เรียบร้อยแล้ว`),

      setFeedback: (articleId, choice) => dispatch({ type: 'setFeedback', articleId, choice }),

      incrementDeflected: () => dispatch({ type: 'incrementDeflected' }),

      // PUT /api/kb creates the row for real, so a refresh no longer loses it.
      addArticle: async ({ title, cat, step }) => {
        const { ok, data } = await putJSON('/api/kb', { title, cat, step });
        if (!ok) {
          showToast(data.error || 'เพิ่มบทความไม่สำเร็จ กรุณาลองใหม่');
          return;
        }
        dispatch({ type: 'addArticle', article: data.article });
        showToast('เพิ่มบทความเรียบร้อยแล้ว');
      },

      addComment: async (articleId, user, txt) => {
        const { ok, data } = await patchJSON(`/api/kb/${articleId}`, {
          action: 'addComment',
          authorName: user.name,
          text: txt,
        });
        if (ok) dispatch({ type: 'setArticle', article: data.article });
        else showToast(data.error || 'ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่');
      },

      acceptComment: async (articleId, index) => {
        const { ok, data } = await patchJSON(`/api/kb/${articleId}`, {
          action: 'acceptComment',
          index,
        });
        if (ok) {
          dispatch({ type: 'setArticle', article: data.article });
          showToast('ทำเครื่องหมายคำตอบนี้ว่าดีที่สุดแล้ว');
        }
      },

      /**
       * Files the ticket via POST /api/tickets/report (priority, category and
       * the AI-suggestion guess are all computed server-side from the real
       * DB). Returns the new ticket's id so the wizard can show its
       * confirmation screen, or null if the request failed.
       */
      submitTicket: async ({ user, title, desc, impact, urgency }) => {
        const { ok, data } = await postJSON('/api/tickets/report', {
          title,
          desc,
          impact,
          urgency,
          reporterId: user.id,
        });
        if (!ok) {
          showToast(data.error || 'แจ้งปัญหาไม่สำเร็จ กรุณาลองใหม่');
          return null;
        }
        dispatch({ type: 'addTicket', ticket: data.ticket });
        return data.ticket.id;
      },

      // Everything below goes through PATCH /api/tickets/:ticketNo — see
      // that route for what each action does server-side. All of them
      // replace the ticket in state with the fresh copy the server returns,
      // so what's on screen always matches the database.
      claimTicket: async (id, user, message) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, { action: 'claim', userId: user.id });
        if (ok) {
          dispatch({ type: 'setTicketRow', ticket: data.ticket });
          showToast(message ?? `รับเรื่อง ${id} เรียบร้อยแล้ว`);
        } else {
          showToast(data.error || 'รับเรื่องไม่สำเร็จ กรุณาลองใหม่');
        }
      },

      setTicketStatus: async (id, status) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, { action: 'setStatus', status });
        if (ok) dispatch({ type: 'setTicketRow', ticket: data.ticket });
      },

      reopenTicket: async (id) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, { action: 'reopen' });
        if (ok) {
          dispatch({ type: 'setTicketRow', ticket: data.ticket });
          showToast('เปิดเรื่องนี้อีกครั้งให้ทีม IT ดูต่อแล้ว');
        }
      },

      resolveTicket: async (id, user, summary) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, {
          action: 'resolve',
          userId: user.id,
          summary,
        });
        if (ok) {
          dispatch({ type: 'setTicketRow', ticket: data.ticket });
          showToast('บันทึกการแก้ไขแล้ว รอผู้ใช้ยืนยัน');
        } else {
          showToast(data.error || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        }
      },

      addInternalNote: async (id, user, txt) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, {
          action: 'addInternalNote',
          userId: user.id,
          text: txt,
        });
        if (ok) dispatch({ type: 'setTicketRow', ticket: data.ticket });
      },

      sendChat: async (id, user, txt, staff) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, {
          action: 'sendChat',
          userId: user.id,
          text: txt,
          staff,
        });
        if (ok) dispatch({ type: 'setTicketRow', ticket: data.ticket });
      },

      /**
       * The reporter confirms the fix. Closes the ticket and, server-side,
       * folds its resolution summary into a new knowledge-base article
       * (kb_articles.source_ticket_id) — same as the design describes.
       */
      confirmFixedYes: async (ticket) => {
        const { ok, data } = await patchJSON(`/api/tickets/${ticket.id}`, { action: 'confirmYes' });
        if (ok) {
          dispatch({ type: 'setTicketRow', ticket: data.ticket });
          showToast('ปิดงานเรียบร้อย ขอบคุณสำหรับการยืนยัน');
        }
      },

      confirmFixedNo: async (id) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, { action: 'confirmNo' });
        if (ok) {
          dispatch({ type: 'setTicketRow', ticket: data.ticket });
          showToast('เปิดเรื่องนี้อีกครั้งให้ทีม IT ดูต่อแล้ว');
        }
      },

      setCsat: async (id, csat) => {
        const { ok, data } = await patchJSON(`/api/tickets/${id}`, { action: 'setCsat', csat });
        if (ok) dispatch({ type: 'setTicketRow', ticket: data.ticket });
      },

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