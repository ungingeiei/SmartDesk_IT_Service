'use client';

// In-memory app state. The design has no backend, so everything the demo mutates
// lives here. Only state that must survive a route change belongs in this store —
// search boxes, form fields and filters stay local to their page.

import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { ASSIGNEES, USERS, defaultKB, defaultTickets } from './data';
import { calcPriority, formatThaiDateTime, formatThaiTime, guessAiSuggestion, guessCategory } from './logic';

const AppContext = createContext(null);

const initialState = {
  currentUserIdx: null,
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
      return { ...state, currentUserIdx: action.idx };

    case 'logout':
      return { ...state, currentUserIdx: null };

    case 'resetPassword':
      return {
        ...state,
        users: state.users.map((u, i) =>
          i === action.idx ? { ...u, password: action.password } : u
        ),
      };

    case 'toast':
      return { ...state, toastMsg: action.msg };

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
          comments: a.comments.map((c, i) => ({ ...c, accepted: i === action.index })),
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

  const currentUser = state.currentUserIdx == null ? null : state.users[state.currentUserIdx];

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
      code: (ASSIGNEES.find((a) => a.name === user.name) || {}).code || '—',
    });

    return {
      login: (idx) => dispatch({ type: 'login', idx }),

      resetPassword: (idx, password) => {
        dispatch({ type: 'resetPassword', idx, password });
        showToast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      },

      logout: () => {
        showToast('ออกจากระบบเรียบร้อยแล้ว');
        dispatch({ type: 'logout' });
      },

      setFeedback: (articleId, choice) => dispatch({ type: 'setFeedback', articleId, choice }),

      incrementDeflected: () => dispatch({ type: 'incrementDeflected' }),

      addArticle: ({ title, cat, step }) => {
        dispatch({
          type: 'addArticle',
          article: {
            id: 'kb' + Date.now(),
            cat,
            title,
            summary: step.slice(0, 60),
            updated: 'วันนี้',
            views: 0,
            tags: [title.toLowerCase()],
            steps: [step],
            comments: [],
          },
        });
        showToast('เพิ่มบทความเรียบร้อยแล้ว');
      },

      addComment: (articleId, user, txt) =>
        dispatch({
          type: 'addComment',
          articleId,
          comment: { who: user.name, when: 'วันนี้', txt, votes: 0, accepted: false },
        }),

      acceptComment: (articleId, index) => {
        dispatch({ type: 'acceptComment', articleId, index });
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

  const value = useMemo(() => ({ ...state, currentUser, ...actions }), [state, currentUser, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
