'use client';

// In-memory app state. The design has no backend, so everything the demo mutates
// lives here. Only state that must survive a route change belongs in this store —
// search boxes, form fields and filters stay local to their page.


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

    case 'setKB':
      return { ...state, kb: action.kb };

    case 'setTickets':
      return { ...state, tickets: action.tickets };

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
    return {

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