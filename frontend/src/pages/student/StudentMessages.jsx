// src/pages/student/Messages.jsx   ← add this route in App.jsx under /student
// App.jsx already has no student messages route — add:
//   const StudentMessages = lazy(() => import("./pages/student/Messages"));
//   <Route path="messages" element={<StudentMessages />} />

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, X, GraduationCap, Loader2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import {
  ContactRow, ChatHeader, MessagesArea,
  InputBar, EmptyState, ConnectionBadge
} from "../../chat/ChatComponents";
import { getAvatarColor } from "../../utils/chatUtils";

const ACCENT = "from-sky-500 to-blue-600";

export default function StudentMessages() {
  const { user } = useAuth();
  const {
    connected, contacts, contactsLoading, rooms,
    threads, onlineUsers, typing,
    joinRoom, sendMessage, sendTyping, markRead, loadMore,
    openDirectRoom,
  } = useChat(user);

  const userId = user?.id || user?._id;

  const [activeRoomId, setActiveRoomId]     = useState(null);
  const [search, setSearch]                 = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    rooms.forEach((r) => joinRoom(r.roomId));
  }, [rooms.length, joinRoom]);

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

  const activeContact = useMemo(() => {
    if (!activeRoom) return null;
    const other = (activeRoom.members || []).find((m) => String(m._id || m) !== String(userId));
    if (!other) return null;
    return {
      id:          String(other._id || other),
      name:        other.name || "Teacher",
      subtitle:    other.role?.toLowerCase(),
      avatarColor: getAvatarColor(String(other._id || other)),
    };
  }, [activeRoom, userId]);

  // Merge contacts that don't yet have rooms into a combined list
  const sidebarItems = useMemo(() => {
    const roomedContactIds = new Set(
      rooms.flatMap((r) => (r.members || []).map((m) => String(m._id || m)))
    );

    const roomItems = rooms
      .filter((r) => r.type !== "group" || true)
      .map((r) => {
        const other = (r.members || []).find((m) => String(m._id || m) !== String(userId));
        return {
          key:      r.roomId,
          roomId:   r.roomId,
          name:     other?.name || r.name || "Chat",
          subtitle: other?.role?.toLowerCase(),
          color:    getAvatarColor(String(other?._id || r.roomId)),
          lastMsg:  r.lastMessage,
          lastTime: r.lastMessageAt,
          unread:   r.unreadCount || 0,
          otherId:  other ? String(other._id || other) : null,
        };
      });

    const contactItems = contacts
      .filter((c) => !roomedContactIds.has(String(c._id || c.id)))
      .map((c) => ({
        key:      c._id || c.id,
        contactId: c._id || c.id,
        name:     c.name,
        subtitle: c.role?.toLowerCase(),
        color:    getAvatarColor(String(c._id || c.id)),
        lastMsg:  null,
        lastTime: null,
        unread:   0,
      }));

    return [...roomItems, ...contactItems]
      .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
  }, [rooms, contacts, userId, search]);

  const totalUnread = rooms.reduce((s, r) => s + (r.unreadCount || 0), 0);

  const handleSelect = async (item) => {
    if (item.roomId) {
      setActiveRoomId(item.roomId);
    } else if (item.contactId) {
      const room = await openDirectRoom(item.contactId);
      if (room) setActiveRoomId(room.roomId);
    }
    setShowMobileChat(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {totalUnread > 0
              ? <span className="text-sky-600 font-semibold">{totalUnread} unread</span>
              : "All caught up"}
            · Teachers & Parents
            <ConnectionBadge connected={connected} />
          </p>
        </div>
        <span className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold rounded-xl">
          {user?.name || "Student"}
        </span>
      </div>

      <div className="flex flex-1 gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className={`w-full sm:w-72 flex-shrink-0 border-r border-gray-100 flex flex-col ${showMobileChat ? "hidden sm:flex" : "flex"}`}>
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-sky-400">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teachers…" className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-gray-400" /></button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {contactsLoading && rooms.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {!contactsLoading && sidebarItems.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">No conversations yet</p>
            )}
            {sidebarItems.map((item) => {
              const contact = { id: item.otherId || item.contactId || item.key, name: item.name, subtitle: item.subtitle, avatarColor: item.color };
              const meta    = { lastMsg: item.lastMsg, lastTime: item.lastTime, unreadCount: item.unread };
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
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showMobileChat && !activeRoomId ? "hidden sm:flex" : "flex"}`}>
          {!activeContact ? (
            <EmptyState
              icon={GraduationCap}
              title="Your Conversations"
              subtitle="Select a teacher from the list to send a message."
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
    </div>
  );
}