'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { USERS } from './data';

const AppContext = createContext(null);

const SESSION_KEY = 'smartdesk.currentUser';

const initialState = {
  currentUser: null,
  authReady: false,

  users: USERS.map((u) => ({ ...u })),

  // Data is loaded from Prisma APIs after login.
  kb: [],
  tickets: [],

  deflectedCount: 132,
  fbChoice: {},
  toastMsg: null,
};

async function apiRequest(method, url, body) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  return {
    ok: res.ok,
    data,
  };
}

const postJSON = (url, body) => apiRequest('POST', url, body);
const putJSON = (url, body) => apiRequest('PUT', url, body);
const patchJSON = (url, body) => apiRequest('PATCH', url, body);

/*
 * Load Knowledge Base.
 */
async function loadKB(dispatch) {
  const res = await fetch('/api/kb');

  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    dispatch({
      type: 'setKB',
      kb: data.articles ?? data ?? [],
    });
  }
}

/*
 * Employee:
 *   /api/tickets/mine
 *
 * IT Support / Admin:
 *   /api/tickets/queue
 */
async function loadTickets(dispatch, user) {
  if (!user) return;

  const isEmployee = user.role === 'employee';

  const res = await fetch(
    isEmployee
      ? `/api/tickets/mine?reporterId=${encodeURIComponent(user.id)}`
      : '/api/tickets/queue'
  );

  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    dispatch({
      type: 'setTickets',
      tickets: data.tickets ?? data ?? [],
    });
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return {
        ...state,
        currentUser: action.user,
      };

    case 'logout':
      return {
        ...state,
        currentUser: null,
        kb: [],
        tickets: [],
      };

    case 'authReady':
      return {
        ...state,
        currentUser: action.user,
        authReady: true,
      };

    case 'hydrate':
      return {
        ...state,
        ...action.payload,
      };

    case 'toast':
      return {
        ...state,
        toastMsg: action.msg,
      };

    case 'setKB':
      return {
        ...state,
        kb: action.kb,
      };

    case 'setTickets':
      return {
        ...state,
        tickets: action.tickets,
      };

    case 'addUser':
      return {
        ...state,
        users: [...state.users, action.user],
      };

    case 'updateUsers': {
      const byCode = new Map(
        action.users.map((u) => [u.code, u])
      );

      return {
        ...state,
        users: state.users.map(
          (u) => byCode.get(u.code) ?? u
        ),
      };
    }

    case 'setFeedback':
      return {
        ...state,
        fbChoice: {
          ...state.fbChoice,
          [action.articleId]: action.choice,
        },
      };

    case 'addArticle':
      return {
        ...state,
        kb: [action.article, ...state.kb],
      };

    case 'setArticle':
      return {
        ...state,
        kb: state.kb.map((article) =>
          article.id === action.article.id
            ? action.article
            : article
        ),
      };

    case 'addTicket':
      return {
        ...state,
        tickets: [action.ticket, ...state.tickets],
      };

    case 'setTicketRow':
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id === action.ticket.id
            ? action.ticket
            : ticket
        ),
      };

    case 'incrementDeflected':
      return {
        ...state,
        deflectedCount: state.deflectedCount + 1,
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState
  );

  const toastTimer = useRef(null);

  /*
   * Restore login session from localStorage.
   */
  useEffect(() => {
    let storedUser = null;

    try {
      const raw = localStorage.getItem(SESSION_KEY);

      if (raw) {
        storedUser = JSON.parse(raw);
      }
    } catch {
      storedUser = null;
    }

    dispatch({
      type: 'authReady',
      user: storedUser,
    });
  }, []);

  /*
   * Load real data from Prisma API after login.
   */
  useEffect(() => {
    if (!state.currentUser) return;

    let cancelled = false;

    async function hydrate() {
      try {
        const [kbRes] = await Promise.all([
          fetch('/api/kb'),
        ]);

        if (cancelled) return;

        const kbData = await kbRes
          .json()
          .catch(() => ({}));

        if (kbRes.ok) {
          dispatch({
            type: 'setKB',
            kb: kbData.articles ?? kbData ?? [],
          });
        }

        await loadTickets(
          dispatch,
          state.currentUser
        );
      } catch (err) {
        console.error(
          'Failed to load data from database:',
          err
        );
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [state.currentUser]);

  const showToast = useCallback((msg) => {
    dispatch({
      type: 'toast',
      msg,
    });

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      dispatch({
        type: 'toast',
        msg: null,
      });
    }, 2200);
  }, []);

  const actions = useMemo(() => {
    return {
      /*
       * Login
       */
      login: (user) => {
        try {
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify(user)
          );
        } catch {
          // Ignore localStorage errors.
        }

        dispatch({
          type: 'login',
          user,
        });

        loadKB(dispatch);
        loadTickets(dispatch, user);
      },

      /*
       * Logout
       */
      logout: () => {
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          // Ignore storage errors.
        }

        showToast('ออกจากระบบเรียบร้อยแล้ว');

        dispatch({
          type: 'logout',
        });
      },

      /*
       * Add user
       */
      addUser: async ({
        code,
        name,
        email,
        title,
        role,
        password,
      }) => {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            name,
            email,
            title,
            role,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(
            data.error || 'เพิ่มผู้ใช้ไม่สำเร็จ'
          );

          throw new Error(
            data.error || 'เพิ่มผู้ใช้ไม่สำเร็จ'
          );
        }

        dispatch({
          type: 'addUser',
          user: data,
        });

        showToast(
          `เพิ่มผู้ใช้ ${data.name} เรียบร้อยแล้ว`
        );
      },

      /*
       * Update user
       */
      updateUser: async (code, patch) => {
        const res = await fetch(
          `/api/users/${encodeURIComponent(code)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(patch),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          showToast(
            data.error ||
              'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ'
          );

          throw new Error(
            data.error ||
              'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ'
          );
        }

        dispatch({
          type: 'updateUsers',
          users: [data],
        });

        showToast(
          'บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว'
        );
      },

      /*
       * Change user status
       */
      setUsersStatus: async (codes, status) => {
        const results = await Promise.all(
          codes.map((code) =>
            fetch(
              `/api/users/${encodeURIComponent(code)}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  status,
                }),
              }
            ).then((r) => r.json())
          )
        );

        dispatch({
          type: 'updateUsers',
          users: results,
        });

        showToast(
          status === 'locked'
            ? `ล็อกบัญชี ${codes.length} รายการแล้ว`
            : `ปลดล็อกบัญชี ${codes.length} รายการแล้ว`
        );
      },

      /*
       * Reset password
       */
      resetPassword: async (user, password) => {
        const res = await fetch(
          '/api/auth/reset-password',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: user.username,
              newPassword: password,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          showToast(
            data.error ||
              'ตั้งรหัสผ่านใหม่ไม่สำเร็จ'
          );

          throw new Error(
            data.error ||
              'ตั้งรหัสผ่านใหม่ไม่สำเร็จ'
          );
        }

        showToast(
          `ตั้งรหัสผ่านใหม่ให้ ${user.name} เรียบร้อยแล้ว`
        );
      },

      /*
       * Knowledge Base feedback
       */
      setFeedback: (articleId, choice) => {
        dispatch({
          type: 'setFeedback',
          articleId,
          choice,
        });
      },

      /*
       * Record deflection
       */
      incrementDeflected: (kbId, user) => {
        dispatch({
          type: 'incrementDeflected',
        });

        fetch('/api/kb-deflections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kbId,
            userId: user?.id,
          }),
        }).catch((err) => {
          console.error(
            'Failed to record deflection',
            err
          );
        });
      },

      /*
       * Add Knowledge Base article
       */
      addArticle: async ({
        title,
        cat,
        step,
      }) => {
        const { ok, data } = await putJSON(
          '/api/kb',
          {
            title,
            cat,
            step,
          }
        );

        if (!ok) {
          showToast(
            data.error ||
              'เพิ่มบทความไม่สำเร็จ'
          );

          return null;
        }

        dispatch({
          type: 'addArticle',
          article: data.article,
        });

        showToast(
          'เพิ่มบทความเรียบร้อยแล้ว'
        );

        return data.article;
      },

      /*
       * Add comment to Knowledge Base article
       */
      addComment: async (
        articleId,
        user,
        txt
      ) => {
        const { ok, data } = await patchJSON(
          `/api/kb/${articleId}`,
          {
            action: 'addComment',
            authorName: user?.name,
            text: txt,
          }
        );

        if (ok) {
          dispatch({
            type: 'setArticle',
            article: data.article,
          });

          showToast(
            'ส่งความคิดเห็นเรียบร้อยแล้ว'
          );
        } else {
          showToast(
            data.error ||
              'ส่งความคิดเห็นไม่สำเร็จ กรุณาลองใหม่'
          );
        }
      },

      /*
       * Accept Knowledge Base comment
       */
      acceptComment: async (
        articleId,
        index
      ) => {
        const { ok, data } = await patchJSON(
          `/api/kb/${articleId}`,
          {
            action: 'acceptComment',
            index,
          }
        );

        if (ok) {
          dispatch({
            type: 'setArticle',
            article: data.article,
          });

          showToast(
            'ทำเครื่องหมายคำตอบนี้ว่าดีที่สุดแล้ว'
          );
        } else {
          showToast(
            data.error ||
              'ไม่สามารถทำเครื่องหมายคำตอบได้'
          );
        }
      },

      /*
       * Submit ticket
       */
      submitTicket: async ({
        user,
        title,
        desc,
        impact,
        urgency,
      }) => {
        const { ok, data } = await postJSON(
          '/api/tickets/report',
          {
            title,
            desc,
            impact,
            urgency,
            reporterId: user.id,
          }
        );

        if (!ok) {
          showToast(
            data.error ||
              'แจ้งปัญหาไม่สำเร็จ กรุณาลองใหม่'
          );

          return null;
        }

        dispatch({
          type: 'addTicket',
          ticket: data.ticket,
        });

        return data.ticket.id;
      },

      /*
       * Claim ticket
       */
      claimTicket: async (
        id,
        user,
        message
      ) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'claim',
            userId: user.id,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });

          showToast(
            message ??
              `รับเรื่อง ${id} เรียบร้อยแล้ว`
          );
        } else {
          showToast(
            data.error ||
              'รับเรื่องไม่สำเร็จ กรุณาลองใหม่'
          );
        }
      },

      /*
       * Change ticket status
       */
      setTicketStatus: async (
        id,
        status
      ) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'setStatus',
            status,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });
        } else {
          showToast(
            data.error ||
              'เปลี่ยนสถานะไม่สำเร็จ'
          );
        }
      },

      /*
       * Reopen ticket
       */
      reopenTicket: async (id) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'reopen',
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });

          showToast(
            'เปิดเรื่องนี้อีกครั้งให้ทีม IT ดูต่อแล้ว'
          );
        } else {
          showToast(
            data.error ||
              'เปิดเรื่องอีกครั้งไม่สำเร็จ'
          );
        }
      },

      /*
       * Resolve ticket
       */
      resolveTicket: async (
        id,
        user,
        summary
      ) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'resolve',
            userId: user.id,
            summary,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });

          showToast(
            'บันทึกการแก้ไขแล้ว รอผู้ใช้ยืนยัน'
          );
        } else {
          showToast(
            data.error ||
              'บันทึกไม่สำเร็จ กรุณาลองใหม่'
          );
        }
      },

      /*
       * Add internal note
       */
      addInternalNote: async (
        id,
        user,
        txt
      ) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'addInternalNote',
            userId: user.id,
            text: txt,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });
        } else {
          showToast(
            data.error ||
              'เพิ่มหมายเหตุไม่สำเร็จ'
          );
        }
      },

      /*
       * Send ticket chat
       */
      sendChat: async (
        id,
        user,
        txt,
        staff
      ) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'sendChat',
            userId: user.id,
            text: txt,
            staff,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });
        } else {
          showToast(
            data.error ||
              'ส่งข้อความไม่สำเร็จ'
          );
        }
      },

      /*
       * User confirms ticket is fixed.
       */
      confirmFixedYes: async (ticket) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${ticket.id}`,
          {
            action: 'confirmYes',
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });

          showToast(
            'ปิดงานเรียบร้อย ขอบคุณสำหรับการยืนยัน'
          );
        } else {
          showToast(
            data.error ||
              'ยืนยันการแก้ไขไม่สำเร็จ'
          );
        }
      },

      /*
       * User says ticket is not fixed.
       */
      confirmFixedNo: async (id) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'confirmNo',
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });

          showToast(
            'เปิดเรื่องนี้อีกครั้งให้ทีม IT ดูต่อแล้ว'
          );
        } else {
          showToast(
            data.error ||
              'เปิดเรื่องอีกครั้งไม่สำเร็จ'
          );
        }
      },

      /*
       * Customer satisfaction score
       */
      setCsat: async (id, csat) => {
        const { ok, data } = await patchJSON(
          `/api/tickets/${id}`,
          {
            action: 'setCsat',
            csat,
          }
        );

        if (ok) {
          dispatch({
            type: 'setTicketRow',
            ticket: data.ticket,
          });
        } else {
          showToast(
            data.error ||
              'บันทึกคะแนนไม่สำเร็จ'
          );
        }
      },

      showToast,
    };
  }, [showToast]);

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error(
      'useApp must be used inside <AppProvider>'
    );
  }

  return ctx;
}