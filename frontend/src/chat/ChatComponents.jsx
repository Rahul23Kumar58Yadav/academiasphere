// src/chat/ChatComponents.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Send, Paperclip, Image, Phone, Video,
  MoreVertical, ArrowLeft, Check, CheckCheck,
  Search, X, ChevronUp, Loader2
} from "lucide-react";
import { getInitials, getAvatarColor, formatTime, formatFull, groupMessagesByDay } from "../utils/chatUtils";

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ contact, size = 10, online = false }) {
  const color = contact?.avatarColor || getAvatarColor(contact?.id || contact?.name || "?");
  const px    = `w-${size} h-${size}`;
  const txt   = size >= 12 ? "text-lg" : size >= 8 ? "text-sm" : "text-xs";
  return (
    <div className={`${px} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 relative shadow-sm`}>
      {contact?.avatar
        ? <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-2xl object-cover" />
        : <span className={txt}>{getInitials(contact?.name || "?")}</span>
      }
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm" />
      )}
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
export function TypingIndicator({ names }) {
  if (!names || names.size === 0) return null;
  const arr   = [...names];
  const label = arr.length === 1
    ? `${arr[0]} is typing`
    : `${arr.slice(0, 2).join(", ")} are typing`;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 italic">
      <span className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {label}…
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
export function MessageBubble({ msg, isMe, accentGradient, showSender }) {
  const readCount = (msg.readBy || []).length;
  const isSending = msg.status === "sending";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5 group`}>
      <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showSender && !isMe && msg.fromName && (
          <span className="text-[11px] font-semibold text-indigo-500 mb-1 ml-1">
            {msg.fromName}
          </span>
        )}
        <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-opacity ${
          isSending ? "opacity-60" : "opacity-100"
        } ${
          isMe
            ? `bg-gradient-to-br ${accentGradient} text-white rounded-2xl rounded-br-sm`
            : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100"
        }`}>
          {msg.text}
          {(msg.attachments || []).map((a, i) => (
            <div key={i} className="mt-1.5 text-xs underline opacity-80 cursor-pointer truncate">
              📎 {a.name}
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-gray-400">{formatFull(msg.time)}</span>
          {isMe && !isSending && (
            readCount > 1
              ? <CheckCheck size={11} className="text-sky-400" />
              : <Check      size={11} className="text-gray-400" />
          )}
          {isSending && <Loader2 size={10} className="text-gray-300 animate-spin" />}
        </div>
      </div>
    </div>
  );
}

// ── Day Divider ───────────────────────────────────────────────────────────────
export function DayDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2 px-2">
      <hr className="flex-1 border-gray-100" />
      <span className="text-[11px] text-gray-400 font-medium px-2.5 py-1 bg-white rounded-full border border-gray-100 whitespace-nowrap shadow-sm">
        {label}
      </span>
      <hr className="flex-1 border-gray-100" />
    </div>
  );
}

// ── Load More Button ──────────────────────────────────────────────────────────
function LoadMoreButton({ onClick, loading }) {
  return (
    <div className="flex justify-center py-2">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 size={12} className="animate-spin" /> Loading…</>
          : <><ChevronUp size={12} /> Load earlier messages</>
        }
      </button>
    </div>
  );
}

// ── Messages Area ─────────────────────────────────────────────────────────────
export function MessagesArea({ messages, userId, accentGradient, isGroup, typingNames, onLoadMore }) {
  const containerRef = useRef(null);
  const bottomRef    = useRef(null);
  const prevLenRef   = useRef(messages.length);
  const [loadingMore, setLoadingMore] = useState(false);

  const grouped = groupMessagesByDay(messages);

  // Scroll to bottom only when new messages arrive (not on load-more)
  useEffect(() => {
    const prevLen = prevLenRef.current;
    const newLen  = messages.length;
    // Only auto-scroll if messages were appended (not prepended via load-more)
    if (newLen > prevLen && messages[newLen - 1]?.from) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLenRef.current = newLen;
  }, [messages]);

  // Also scroll on typing indicator change
  useEffect(() => {
    if (typingNames?.size > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingNames?.size]);

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore) return;
    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
    // Restore scroll position so it doesn't jump to top
    if (container) {
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeight;
    }
  }, [onLoadMore, loadingMore]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-gray-50/40"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`.chat-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Load more */}
      {onLoadMore && messages.length >= 50 && (
        <LoadMoreButton onClick={handleLoadMore} loading={loadingMore} />
      )}

      {grouped.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40 min-h-[200px]">
          <div className="text-5xl">💬</div>
          <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
        </div>
      )}

      {grouped.map((item) =>
        item.type === "divider"
          ? <DayDivider key={item.key} label={item.label} />
          : <MessageBubble
              key={item.id}
              msg={item}
              isMe={item.from === userId}
              accentGradient={accentGradient}
              showSender={isGroup}
            />
      )}

      <TypingIndicator names={typingNames} />
      <div ref={bottomRef} />
    </div>
  );
}

// ── Input Bar ─────────────────────────────────────────────────────────────────
export function InputBar({ onSend, onTyping, placeholder = "Type a message…", accentGradient }) {
  const [text, setText]       = useState("");
  const typingActive = useRef(false);
  const typingTimer  = useRef(null);
  const inputRef     = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingActive.current) {
      onTyping?.(true);
      typingActive.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      onTyping?.(false);
      typingActive.current = false;
    }, 2000);
  };

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    clearTimeout(typingTimer.current);
    onTyping?.(false);
    typingActive.current = false;
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="px-3 py-3 border-t border-gray-100 bg-white">
      <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <div className="flex gap-1 pb-0.5 flex-shrink-0">
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <Paperclip size={16} />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <Image size={16} />
          </button>
        </div>
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 resize-none outline-none max-h-28 placeholder:text-gray-400 py-0.5 min-w-0"
          style={{ lineHeight: "1.6" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`flex-shrink-0 w-9 h-9 bg-gradient-to-br ${accentGradient} rounded-xl flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition-all shadow-md active:scale-95`}
        >
          <Send size={15} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1 pl-1">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}

// ── Contact Row ───────────────────────────────────────────────────────────────
export function ContactRow({ contact, isActive, meta, online, onClick, roleColor }) {
  const unread = meta?.unreadCount || 0;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all ${
        isActive
          ? "border-r-2 border-indigo-500 bg-indigo-50/70"
          : "hover:bg-gray-50/80"
      }`}
    >
      <Avatar contact={contact} size={10} online={online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
            {contact.name}
          </p>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-1">
            {formatTime(meta?.lastTime)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5 gap-1">
          <p className="text-xs text-gray-500 truncate min-w-0">
            {meta?.lastMsg || <span className="italic text-gray-400">No messages yet</span>}
          </p>
          {unread > 0 && (
            <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
        {contact.subtitle && (
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${roleColor?.badge || "bg-gray-100 text-gray-500"}`}>
            {contact.subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Chat Header ───────────────────────────────────────────────────────────────
export function ChatHeader({ contact, online, onBack, extraActions, accentGradient }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm flex-shrink-0">
      <button
        onClick={onBack}
        className="sm:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      <Avatar contact={contact} size={10} online={online} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate text-sm">{contact?.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {online
            ? <span className="text-green-500 font-medium">● Online</span>
            : <span className="text-gray-400">● Offline</span>
          }
          {contact?.subtitle ? <span className="text-gray-400"> · {contact.subtitle}</span> : null}
        </p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"><Phone   size={17} /></button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"><Video   size={17} /></button>
        <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"><MoreVertical size={17} /></button>
        {extraActions}
      </div>
    </div>
  );
}

// ── Connection Badge ──────────────────────────────────────────────────────────
export function ConnectionBadge({ connected }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
      connected
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-700 animate-pulse"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-amber-500"}`} />
      {connected ? "Live" : "Reconnecting…"}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
        {Icon && <Icon size={36} className="text-indigo-300" />}
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}