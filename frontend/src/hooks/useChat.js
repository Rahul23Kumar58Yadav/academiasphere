// src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const WS_BASE  = import.meta.env.VITE_WS_URL  || "ws://localhost:5000";

// WS URL — userId/role/name are convenience params for the server log.
// Real auth is done server-side via the httpOnly cookie automatically
// sent with the WS handshake (same origin).
function buildWsUrl(user) {
  const id   = user?.id || user?._id || "";
  const role = user?.role || "";
  const name = encodeURIComponent(user?.name || "");
  return `${WS_BASE}/ws?userId=${id}&role=${role}&name=${name}`;
}

export function useChat(user) {
  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const typingTimers   = useRef({});
  const mountedRef     = useRef(true);

  const [connected,       setConnected]       = useState(false);
  const [contacts,        setContacts]        = useState([]);
  const [rooms,           setRooms]           = useState([]);
  const [threads,         setThreads]         = useState({});
  const [onlineUsers,     setOnlineUsers]     = useState({});
  const [typing,          setTyping]          = useState({});
  const [contactsLoading, setContactsLoading] = useState(true);

  // Derive a stable, truthy userId — empty string = not ready
  const userId = user?.id || user?._id || "";
  const isReady = Boolean(userId && user?.role);  // only connect when auth is confirmed

  // ── Fetch contacts ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    setContactsLoading(true);
    fetch(`${API_BASE}/chat/contacts`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (mountedRef.current) setContacts(d.contacts || []); })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setContactsLoading(false); });
  }, [isReady]);

  // ── Fetch room list ─────────────────────────────────────────────────────────
  const fetchRooms = useCallback(() => {
    if (!isReady) return;
    fetch(`${API_BASE}/chat/rooms`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (mountedRef.current) setRooms(d.rooms || []); })
      .catch(() => {});
  }, [isReady]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── WebSocket message handler ───────────────────────────────────────────────
  const handleServerMsg = useCallback((data) => {
    switch (data.type) {

      case "AUTH_ERROR":
        // Server rejected the connection — stop reconnecting
        console.warn("[Chat] Auth rejected by server:", data.message);
        clearTimeout(reconnectTimer.current);
        wsRef.current?.close();
        break;

      case "MESSAGE": {
        const confirmed = { ...data.message, status: "sent" };
        setThreads((prev) => {
          const room = prev[data.roomId] || [];
          if (room.some((m) => m.id === confirmed.id)) return prev;
          const optId = confirmed.optimisticId;
          if (optId && room.some((m) => m.id === optId)) {
            return { ...prev, [data.roomId]: room.map((m) => m.id === optId ? confirmed : m) };
          }
          return { ...prev, [data.roomId]: [...room, confirmed] };
        });
        setRooms((prev) =>
          prev.map((r) =>
            r.roomId === data.roomId
              ? { ...r, lastMessage: confirmed.text, lastMessageAt: confirmed.time }
              : r
          )
        );
        break;
      }

      case "MESSAGES_HISTORY":
        setThreads((prev) => ({ ...prev, [data.roomId]: data.messages }));
        break;

      case "MORE_MESSAGES":
        setThreads((prev) => ({
          ...prev,
          [data.roomId]: [...(data.messages || []), ...(prev[data.roomId] || [])],
        }));
        break;

      case "READ_RECEIPT":
        setThreads((prev) => {
          const room = (prev[data.roomId] || []).map((m) =>
            data.messageIds.includes(m.id)
              ? { ...m, readBy: [...new Set([...(m.readBy || []), data.userId])] }
              : m
          );
          return { ...prev, [data.roomId]: room };
        });
        setRooms((prev) =>
          prev.map((r) =>
            r.roomId === data.roomId && data.userId !== userId
              ? { ...r, unreadCount: Math.max(0, (r.unreadCount || 0) - data.messageIds.length) }
              : r
          )
        );
        break;

      case "TYPING_START": {
        const key = `${data.roomId}:${data.userName}`;
        setTyping((prev) => {
          const s = new Set(prev[data.roomId] || []);
          s.add(data.userName);
          return { ...prev, [data.roomId]: s };
        });
        clearTimeout(typingTimers.current[key]);
        typingTimers.current[key] = setTimeout(() => {
          setTyping((prev) => {
            const s = new Set(prev[data.roomId] || []);
            s.delete(data.userName);
            return { ...prev, [data.roomId]: s };
          });
        }, 3500);
        break;
      }

      case "TYPING_STOP":
        setTyping((prev) => {
          const s = new Set(prev[data.roomId] || []);
          s.delete(data.userName);
          return { ...prev, [data.roomId]: s };
        });
        break;

      case "PRESENCE":
        setOnlineUsers((prev) => ({ ...prev, [data.userId]: data.online }));
        break;

      case "PRESENCE_BULK":
        setOnlineUsers((prev) => ({ ...prev, ...data.users }));
        break;

      default:
        break;
    }
  }, [userId]);

  // ── WebSocket connect — only when user is authenticated ─────────────────────
  const connect = useCallback(() => {
    // Hard guard: never connect without a confirmed user
    if (!isReady) return;
    // Don't open a second socket if one is already open/connecting
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) return;

    clearTimeout(reconnectTimer.current);

    const ws = new WebSocket(buildWsUrl(user));
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      reconnectDelay.current = 1000;  // reset backoff on successful connect
    };

    ws.onmessage = (e) => {
      try { handleServerMsg(JSON.parse(e.data)); } catch (_) {}
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      setConnected(false);

      // Code 4001 = server auth rejection — don't reconnect
      if (event.code === 4001 || event.code === 4003) {
        console.warn("[Chat] WS closed by server (auth). Not reconnecting.");
        return;
      }

      // Exponential backoff: 1s → 2s → 4s → … → 30s max
      const delay = Math.min(reconnectDelay.current, 30000);
      reconnectDelay.current = delay * 2;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [isReady, user, handleServerMsg]);

  // Connect when user becomes ready; disconnect on logout
  useEffect(() => {
    mountedRef.current = true;

    if (isReady) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [isReady, connect]);

  // ── Public API ──────────────────────────────────────────────────────────────

  const wsSend = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const joinRoom = useCallback((roomId) => {
    wsSend({ type: "JOIN_ROOM", roomId, userId });
  }, [wsSend, userId]);

  const sendMessage = useCallback((roomId, text, attachments = []) => {
    if (!text.trim()) return;

    const optimisticId = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic = {
      id:          optimisticId,
      optimisticId,
      from:        userId,
      fromName:    user?.name,
      fromRole:    user?.role,
      text,
      attachments,
      readBy:      [userId],
      time:        new Date().toISOString(),
      status:      "sending",
    };

    setThreads((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), optimistic],
    }));

    wsSend({ type: "SEND_MESSAGE", roomId, message: optimistic });
  }, [wsSend, userId, user]);

  const sendTyping = useCallback((roomId, isTyping) => {
    wsSend({ type: isTyping ? "TYPING_START" : "TYPING_STOP", roomId, userId, userName: user?.name });
  }, [wsSend, userId, user]);

  const markRead = useCallback((roomId, messageIds) => {
    if (!messageIds?.length) return;
    wsSend({ type: "MARK_READ", roomId, messageIds, userId });
    setThreads((prev) => {
      const room = (prev[roomId] || []).map((m) =>
        messageIds.includes(m.id)
          ? { ...m, readBy: [...new Set([...(m.readBy || []), userId])] }
          : m
      );
      return { ...prev, [roomId]: room };
    });
  }, [wsSend, userId]);

  const loadMore = useCallback((roomId) => {
    const oldest = threads[roomId]?.[0]?.time;
    wsSend({ type: "LOAD_MORE", roomId, before: oldest });
  }, [wsSend, threads]);

  const openDirectRoom = useCallback(async (targetUserId) => {
    try {
      const res  = await fetch(`${API_BASE}/chat/rooms/direct`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        const { roomId } = data.room;
        setRooms((prev) =>
          prev.some((r) => r.roomId === roomId) ? prev : [data.room, ...prev]
        );
        joinRoom(roomId);
        return data.room;
      }
    } catch (e) {
      console.error("[Chat] openDirectRoom:", e.message);
    }
    return null;
  }, [joinRoom]);

  return {
    connected,
    contacts,
    contactsLoading,
    rooms,
    threads,
    onlineUsers,
    typing,
    joinRoom,
    sendMessage,
    sendTyping,
    markRead,
    loadMore,
    openDirectRoom,
    refreshRooms: fetchRooms,
  };
}
