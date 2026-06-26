// src/pages/parent/Messages.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, X, MessageSquare, Loader2, ShieldCheck,
  Plus, RefreshCw, GraduationCap, Users, AlertCircle,
  Check, ChevronRight,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import {
  ContactRow, ChatHeader, MessagesArea,
  InputBar, EmptyState, ConnectionBadge,
} from "../../chat/ChatComponents";
import { getAvatarColor } from "../../utils/chatUtils";

const ACCENT = "from-emerald-500 to-teal-600";

// ── Child info banner ─────────────────────────────────────────────────────────
function ChildBanner({ user }) {
  const child = user?.children?.[0];
  const name  = child?.name || user?.childName || null;
  const cls   = child?.class || child?.grade || null;
  if (!name) return null;
  return (
    <div className="mx-3 mt-3 mb-1 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
        {name[0]}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-emerald-600 font-medium">Your child</p>
        <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
        {cls && <p className="text-xs text-gray-500">{cls}</p>}
      </div>
      <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 ml-auto" />
    </div>
  );
}

// ── Compose Modal — pick a teacher/admin to message ───────────────────────────
function ComposeModal({ contacts, loading, onClose, onStart }) {
  const [q,      setQ]      = useState("");
  const [sel,    setSel]    = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = contacts.filter((c) => {
    const matchQ    = c.name.toLowerCase().includes(q.toLowerCase());
    const role      = (c.role || "").toLowerCase();
    const matchRole =
      filter === "all"    ? true :
      filter === "teacher" ? role.includes("teacher") :
      filter === "admin"  ? role.includes("admin") :
      true;
    return matchQ && matchRole;
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${ACCENT} px-5 py-4 flex items-center justify-between`}>
          <div>
            <h2 className="text-white font-bold text-base">New Conversation</h2>
            <p className="text-white/70 text-xs mt-0.5">Pick a teacher or admin to message</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-400 transition-colors">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…"
              className="flex-1 text-sm outline-none text-gray-700"
              autoFocus
            />
            {q && (
              <button onClick={() => setQ("")}>
                <X size={13} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Role filter pills */}
          <div className="flex gap-1.5">
            {[["all", "All"], ["teacher", "Teachers"], ["admin", "Admin"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filter === v
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Contact list */}
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading contacts…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-8">
                <Users size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No contacts found</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {q ? "Try a different search" : "No teachers are available yet"}
                </p>
              </div>
            )}
            {filtered.map((c) => {
              const id    = c._id || c.id;
              const color = getAvatarColor(String(id));
              const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const isSel = sel === id;
              return (
                <div
                  key={id}
                  onClick={() => setSel(isSel ? null : id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSel
                      ? "bg-emerald-50 border border-emerald-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {(c.role || "").toLowerCase()}
                      {c.class || c.grade ? ` · ${c.class || c.grade}` : ""}
                    </p>
                  </div>
                  {isSel && <Check size={16} className="text-emerald-600 flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Action */}
          <button
            disabled={!sel}
            onClick={() => { onStart(sel); onClose(); }}
            className={`w-full py-2.5 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold text-sm disabled:opacity-30 hover:opacity-90 transition-all flex items-center justify-center gap-2`}
          >
            <ChevronRight size={16} />
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state when contacts/rooms are both empty ────────────────────────────
function NoContactsState({ onCompose, loading, onRefresh }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
        <GraduationCap size={30} className="text-emerald-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700">No teachers found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">
          Teachers assigned to your child's class will appear here.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-500 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
        <button
          onClick={onCompose}
          className={`flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${ACCENT} text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm`}
        >
          <Plus size={13} /> Browse All
        </button>
      </div>
    </div>
  );
}

// ── Connection error banner ───────────────────────────────────────────────────
function ErrorBanner({ onRetry }) {
  return (
    <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
      <AlertCircle size={13} className="flex-shrink-0" />
      <span className="flex-1">Could not load contacts.</span>
      <button onClick={onRetry} className="font-semibold underline whitespace-nowrap">Retry</button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function ParentMessages() {
  const { user } = useAuth();
  const {
    connected, contacts, contactsLoading, rooms,
    threads, onlineUsers, typing,
    joinRoom, sendMessage, sendTyping, markRead, loadMore,
    openDirectRoom, refreshRooms,
  } = useChat(user);

  const userId = user?.id || user?._id;

  const [activeRoomId,    setActiveRoomId]    = useState(null);
  const [search,          setSearch]          = useState("");
  const [showMobileChat,  setShowMobileChat]  = useState(false);
  const [showCompose,     setShowCompose]     = useState(false);
  const [contactsError,   setContactsError]   = useState(false);

  // Join all rooms whenever room list changes
  useEffect(() => {
    rooms.forEach((r) => joinRoom(r.roomId));
  }, [rooms.length, joinRoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark messages as read when opening a room
  useEffect(() => {
    if (!activeRoomId) return;
    const unread = (threads[activeRoomId] || [])
      .filter((m) => m.from !== userId && !(m.readBy || []).includes(userId))
      .map((m) => m.id);
    if (unread.length) markRead(activeRoomId, unread);
  }, [activeRoomId, threads, userId, markRead]);

  // Detect contacts load failure (loaded but still empty after 5s)
  useEffect(() => {
    if (contactsLoading) { setContactsError(false); return; }
    const timer = setTimeout(() => {
      if (contacts.length === 0 && rooms.length === 0) setContactsError(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [contactsLoading, contacts.length, rooms.length]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const activeRoom     = rooms.find((r) => r.roomId === activeRoomId);
  const activeMessages = threads[activeRoomId] || [];
  const activeTyping   = typing[activeRoomId];

  const activeContact = useMemo(() => {
    if (!activeRoom) return null;
    const other = (activeRoom.members || []).find(
      (m) => String(m._id || m) !== String(userId)
    );
    if (!other) return null;
    return {
      id:          String(other._id || other),
      name:        other.name || "Teacher",
      subtitle:    other.role
        ? other.role.charAt(0).toUpperCase() + other.role.slice(1).toLowerCase()
        : "Teacher",
      avatarColor: getAvatarColor(String(other._id || other)),
    };
  }, [activeRoom, userId]);

  // Merge rooms (existing chats) + contacts (no room yet) into sidebar list
  const sidebarItems = useMemo(() => {
    const roomedIds = new Set(
      rooms.flatMap((r) => (r.members || []).map((m) => String(m._id || m)))
    );

    const roomItems = rooms.map((r) => {
      const other = (r.members || []).find(
        (m) => String(m._id || m) !== String(userId)
      );
      return {
        key:      r.roomId,
        roomId:   r.roomId,
        name:     other?.name || "Teacher",
        subtitle: other?.role
          ? other.role.charAt(0).toUpperCase() + other.role.slice(1).toLowerCase()
          : "Teacher",
        color:    getAvatarColor(String(other?._id || r.roomId)),
        otherId:  other ? String(other._id || other) : null,
        lastMsg:  r.lastMessage   || "",
        lastTime: r.lastMessageAt || null,
        unread:   r.unreadCount   || 0,
      };
    });

    const contactItems = contacts
      .filter((c) => !roomedIds.has(String(c._id || c.id)))
      .map((c) => ({
        key:       c._id || c.id,
        contactId: String(c._id || c.id),
        name:      c.name,
        subtitle:  c.role
          ? c.role.charAt(0).toUpperCase() + c.role.slice(1).toLowerCase()
          : "",
        color:    getAvatarColor(String(c._id || c.id)),
        otherId:  String(c._id || c.id),
        lastMsg:  null,
        lastTime: null,
        unread:   0,
      }));

    return [...roomItems, ...contactItems]
      .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
  }, [rooms, contacts, userId, search]);

  const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = useCallback(async (item) => {
    if (item.roomId) {
      setActiveRoomId(item.roomId);
    } else if (item.contactId) {
      const room = await openDirectRoom(item.contactId);
      if (room) setActiveRoomId(room.roomId);
    }
    setShowMobileChat(true);
  }, [openDirectRoom]);

  const handleComposeStart = useCallback(async (contactId) => {
    const room = await openDirectRoom(contactId);
    if (room) {
      setActiveRoomId(room.roomId);
      setShowMobileChat(true);
    }
  }, [openDirectRoom]);

  const handleRefresh = useCallback(() => {
    setContactsError(false);
    refreshRooms();
  }, [refreshRooms]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {totalUnread > 0
              ? <span className="text-emerald-600 font-semibold">{totalUnread} unread</span>
              : "All caught up"}
            · School Communication
            <ConnectionBadge connected={connected} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={contactsLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className={`flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all`}
          >
            <Plus size={15} /> New Message
          </button>
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
            Parent Portal
          </span>
        </div>
      </div>

      {/* ── Main Panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">

        {/* Sidebar */}
        <div className={`w-full sm:w-72 flex-shrink-0 border-r border-gray-100 flex flex-col ${showMobileChat ? "hidden sm:flex" : "flex"}`}>

          {/* Child banner */}
          <ChildBanner user={user} />

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-emerald-400 transition-colors">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teachers…"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 min-w-0"
              />
              {search && (
                <button onClick={() => setSearch("")} className="flex-shrink-0">
                  <X size={13} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Error banner */}
          {contactsError && !contactsLoading && (
            <ErrorBanner onRetry={handleRefresh} />
          )}

          {/* Contact / room list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">

            {/* Loading skeleton */}
            {contactsLoading && rooms.length === 0 && contacts.length === 0 && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state (not loading, nothing found) */}
            {!contactsLoading && sidebarItems.length === 0 && (
              <NoContactsState
                onCompose={() => setShowCompose(true)}
                loading={contactsLoading}
                onRefresh={handleRefresh}
              />
            )}

            {/* Items */}
            {sidebarItems.map((item) => {
              const contact = {
                id:          item.otherId || item.key,
                name:        item.name,
                subtitle:    item.subtitle,
                avatarColor: item.color,
              };
              const meta = {
                lastMsg:     item.lastMsg,
                lastTime:    item.lastTime,
                unreadCount: item.unread,
              };
              return (
                <ContactRow
                  key={item.key}
                  contact={contact}
                  isActive={activeRoomId === item.roomId}
                  meta={meta}
                  online={onlineUsers[contact.id]}
                  onClick={() => handleSelect(item)}
                  roleColor={{ badge: "bg-violet-100 text-violet-700" }}
                />
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Message your child's teachers and school administration.
            </p>
          </div>
        </div>

        {/* ── Chat area ──────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showMobileChat && !activeRoomId ? "hidden sm:flex" : "flex"}`}>
          {!activeContact ? (
            <EmptyState
              icon={MessageSquare}
              title="Connect with Teachers"
              subtitle="Select a teacher from the list or start a new conversation."
              action={
                <button
                  onClick={() => setShowCompose(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${ACCENT} text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-sm`}
                >
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
                isGroup={false}
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

      {/* ── Compose Modal ─────────────────────────────────────────────────── */}
      {showCompose && (
        <ComposeModal
          contacts={contacts}
          loading={contactsLoading}
          onClose={() => setShowCompose(false)}
          onStart={handleComposeStart}
        />
      )}
    </div>
  );
}