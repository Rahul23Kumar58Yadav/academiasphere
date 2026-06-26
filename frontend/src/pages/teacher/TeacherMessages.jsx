// src/pages/teacher/Message.jsx   ← matches your App.jsx import path exactly
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, Search, X, Bell, BookOpen, Check,
  Users, ChevronDown, Loader2
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import {
  Avatar, ContactRow, ChatHeader, MessagesArea,
  InputBar, EmptyState, ConnectionBadge
} from "../../chat/ChatComponents";
import { ROLE_COLORS, getAvatarColor } from "../../utils/chatUtils";

const ACCENT = "from-violet-600 to-indigo-600";

// ── Compose Modal ─────────────────────────────────────────────────────────────
function ComposeModal({ contacts, loading, onClose, onStart }) {
  const [q, setQ]     = useState("");
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = contacts.filter((c) => {
    const matchQ    = c.name.toLowerCase().includes(q.toLowerCase());
    const matchRole = filter === "all" || c.role?.toLowerCase() === filter;
    return matchQ && matchRole;
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${ACCENT} px-5 py-4 flex items-center justify-between`}>
          <h2 className="text-white font-bold">New Conversation</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-400">
            <Search size={14} className="text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…" className="flex-1 text-sm outline-none" autoFocus />
          </div>
          {/* Role filter pills */}
          <div className="flex gap-1.5">
            {[["all","All"],["student","Students"],["parent","Parents"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter===v?"bg-violet-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {loading && <p className="text-center py-6 text-gray-400 text-sm flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin"/>Loading…</p>}
            {!loading && filtered.length === 0 && <p className="text-center py-6 text-sm text-gray-400">No results</p>}
            {filtered.map((c) => {
              const contact = {
                ...c,
                id:          c._id || c.id,
                subtitle:    c.class || c.grade || c.role,
                avatarColor: getAvatarColor(c._id || c.id || c.name),
              };
              return (
                <div key={contact.id} onClick={() => setSel(contact.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${sel===contact.id?"bg-indigo-50 border border-indigo-200":"hover:bg-gray-50"}`}>
                  <Avatar contact={contact} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{c.role?.toLowerCase()}{c.class ? ` · ${c.class}` : ""}</p>
                  </div>
                  {sel === contact.id && <Check size={15} className="text-indigo-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
          <button disabled={!sel} onClick={() => { onStart(sel); onClose(); }}
            className={`w-full py-2.5 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold disabled:opacity-30 text-sm hover:opacity-90 transition-all`}>
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Announce Modal ────────────────────────────────────────────────────────────
function AnnounceModal({ groupRooms, onClose, onSend }) {
  const [text, setText]       = useState("");
  const [selected, setSelected] = useState(groupRooms.map((r) => r.roomId));
  const toggle = (id) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">📢 Broadcast Announcement</h2>
            <p className="text-white/75 text-xs mt-0.5">Send to selected class groups</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {groupRooms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Send To</p>
              <div className="flex flex-wrap gap-2">
                {groupRooms.map((r) => (
                  <button key={r.roomId} onClick={() => toggle(r.roomId)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selected.includes(r.roomId)?"bg-indigo-600 text-white border-indigo-600":"bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Message *</p>
            <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Unit test on Friday. Chapters 1–5. Bring your ID cards."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none transition-all" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50">Cancel</button>
            <button disabled={!text.trim() || selected.length === 0}
              onClick={() => { onSend(text, selected); onClose(); }}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-30 text-sm hover:opacity-90">
              📢 Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherMessages() {
  const { user } = useAuth();
  const {
    connected, contacts, contactsLoading, rooms,
    threads, onlineUsers, typing,
    joinRoom, sendMessage, sendTyping, markRead, loadMore,
    openDirectRoom, refreshRooms,
  } = useChat(user);

  const userId = user?.id || user?._id;

  const [activeRoomId, setActiveRoomId] = useState(null);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [showCompose, setShowCompose]   = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Join all rooms on load
  useEffect(() => {
    rooms.forEach((r) => joinRoom(r.roomId));
  }, [rooms.length, joinRoom]);

  // Mark read when opening a room
  useEffect(() => {
    if (!activeRoomId) return;
    const unread = (threads[activeRoomId] || [])
      .filter((m) => m.from !== userId && !(m.readBy || []).includes(userId))
      .map((m) => m.id);
    if (unread.length) markRead(activeRoomId, unread);
  }, [activeRoomId, threads, userId, markRead]);

  const activeRoom     = rooms.find((r) => r.roomId === activeRoomId);
  const activeMessages = threads[activeRoomId] || [];
  const activeTyping   = typing[activeRoomId];

  // Derive contact info for active room header
  const activeContact = useMemo(() => {
    if (!activeRoom) return null;
    if (activeRoom.type === "group") {
      return {
        id:          activeRoom.roomId,
        name:        activeRoom.name,
        subtitle:    `${activeRoom.members?.length || 0} members`,
        avatarColor: getAvatarColor(activeRoom.roomId),
      };
    }
    // Direct: find the other member
    const other = (activeRoom.members || []).find((m) => String(m._id || m) !== String(userId));
    return other ? {
      id:          String(other._id || other),
      name:        other.name || "User",
      subtitle:    other.role?.toLowerCase(),
      avatarColor: getAvatarColor(String(other._id || other)),
    } : null;
  }, [activeRoom, userId]);

  // Sorted, filtered sidebar list
  const sidebarRooms = useMemo(() => {
    return rooms
      .filter((r) => {
        const name = r.type === "group" ? r.name : (r.members || []).find((m) => String(m._id || m) !== String(userId))?.name || "";
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (filter === "group")   return r.type === "group";
        if (filter === "student") return r.type === "direct"; // simplified
        return true;
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
  }, [rooms, search, filter, userId]);

  const groupRooms   = rooms.filter((r) => r.type === "group");
  const totalUnread  = rooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

  const handleOpenContact = async (contactId) => {
    const room = await openDirectRoom(contactId);
    if (room) {
      setActiveRoomId(room.roomId);
      setShowMobileChat(true);
    }
  };

  const handleAnnounce = (text, roomIds) => {
    roomIds.forEach((rid) => sendMessage(rid, `📢 ${text}`));
  };

  const openRoom = (roomId) => {
    setActiveRoomId(roomId);
    setShowMobileChat(true);
  };

  // Helper: get display info for a room row
  const roomDisplayInfo = (room) => {
    if (room.type === "group") {
      return {
        contact: { id: room.roomId, name: room.name, subtitle: `${room.members?.length||0} members`, avatarColor: getAvatarColor(room.roomId) },
        meta: { lastMsg: room.lastMessage, lastTime: room.lastMessageAt, unreadCount: room.unreadCount || 0 },
      };
    }
    const other = (room.members || []).find((m) => String(m._id || m) !== String(userId));
    const contact = other ? {
      id: String(other._id || other),
      name: other.name || "User",
      subtitle: other.role?.toLowerCase(),
      avatarColor: getAvatarColor(String(other._id || other)),
    } : { id: room.roomId, name: "Unknown", avatarColor: getAvatarColor(room.roomId) };
    return {
      contact,
      meta: { lastMsg: room.lastMessage, lastTime: room.lastMessageAt, unreadCount: room.unreadCount || 0 },
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {totalUnread > 0
              ? <span className="text-violet-600 font-semibold">{totalUnread} unread</span>
              : "All caught up"}
            · Students & Parents
            <ConnectionBadge connected={connected} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnnounce(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-amber-200 text-amber-700 bg-amber-50 rounded-xl font-semibold text-sm hover:bg-amber-100 transition-colors">
            <Bell size={15} /> Announce
          </button>
          <button onClick={() => setShowCompose(true)}
            className={`flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all text-sm`}>
            <Plus size={16} /> New Message
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${showMobileChat ? "hidden sm:flex" : "flex"}`}>
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-400">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…" className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-gray-400" /></button>}
            </div>
            <div className="flex gap-1">
              {[["all","All"],["group","Groups"],["student","Direct"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter===v?"bg-violet-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {sidebarRooms.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">No conversations yet.</p>
                <button onClick={() => setShowCompose(true)}
                  className="mt-3 text-xs text-violet-600 font-semibold hover:underline">
                  Start one →
                </button>
              </div>
            )}
            {sidebarRooms.map((room) => {
              const { contact, meta } = roomDisplayInfo(room);
              return (
                <ContactRow
                  key={room.roomId}
                  contact={contact}
                  isActive={activeRoomId === room.roomId}
                  meta={meta}
                  online={onlineUsers[contact.id]}
                  onClick={() => openRoom(room.roomId)}
                  roleColor={ROLE_COLORS[room.type === "group" ? "teacher" : "student"]}
                />
              );
            })}
          </div>
        </div>

        {/* ── Chat ─────────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showMobileChat && !activeRoomId ? "hidden sm:flex" : "flex"}`}>
          {!activeContact ? (
            <EmptyState
              icon={BookOpen}
              title="Select a Conversation"
              subtitle="Choose a student, parent, or class group to start messaging."
              action={
                <button onClick={() => setShowCompose(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold text-sm hover:opacity-90`}>
                  <Plus size={15} /> New Message
                </button>
              }
            />
          ) : (
            <>
              <ChatHeader
                contact={activeContact}
                online={onlineUsers[activeContact.id]}
                onBack={() => { setShowMobileChat(false); setActiveRoomId(null); }}
                accentGradient={ACCENT}
              />
              <MessagesArea
                messages={activeMessages}
                userId={userId}
                accentGradient={ACCENT}
                isGroup={activeRoom?.type === "group"}
                typingNames={activeTyping}
                onLoadMore={() => loadMore(activeRoomId)}
              />
              <InputBar
                onSend={(t) => sendMessage(activeRoomId, t)}
                onTyping={(v) => sendTyping(activeRoomId, v)}
                placeholder={`Message ${activeContact.name}…`}
                accentGradient={ACCENT}
              />
            </>
          )}
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          contacts={contacts}
          loading={contactsLoading}
          onClose={() => setShowCompose(false)}
          onStart={handleOpenContact}
        />
      )}
      {showAnnounce && (
        <AnnounceModal
          groupRooms={groupRooms}
          onClose={() => setShowAnnounce(false)}
          onSend={handleAnnounce}
        />
      )}
    </div>
  );
}