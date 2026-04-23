import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Plus,
  Users,
  User,
  ChevronDown,
  X,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  Star,
  StarOff,
  Trash2,
  Filter,
  BookOpen,
  Bell,
  Image,
} from 'lucide-react';

// ─── Seed Data ────────────────────────────────────────────────────────────────
const now = Date.now();
function minsAgo(n)  { return new Date(now - n * 60000); }
function hoursAgo(n) { return new Date(now - n * 3600000); }
function daysAgo(n)  { return new Date(now - n * 86400000); }

function formatTime(date) {
  if (!date) return '';
  const d   = new Date(date);
  const diff = (now - d) / 86400000;
  if (diff < 1)   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 2)   return 'Yesterday';
  if (diff < 7)   return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}
function formatFull(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function sameDay(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dayLabel(date) {
  const d = new Date(date);
  const diff = (now - d) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

const CONTACTS = [
  { id: 'c1', name: 'Aarav Kumar',    role: 'student', class: '10-A', avatar: null, color: 'from-blue-400 to-indigo-500',    online: true,  starred: false },
  { id: 'c2', name: 'Mrs. Priya Kumar', role: 'parent', child: 'Aarav Kumar (10-A)', avatar: null, color: 'from-purple-400 to-pink-500', online: false, starred: true  },
  { id: 'c3', name: 'Siya Sharma',    role: 'student', class: '10-B', avatar: null, color: 'from-pink-400 to-rose-500',      online: true,  starred: false },
  { id: 'c4', name: 'Mr. Raj Sharma', role: 'parent',  child: 'Siya Sharma (10-B)', avatar: null, color: 'from-emerald-400 to-teal-500', online: true,  starred: false },
  { id: 'c5', name: 'Rohan Mehta',    role: 'student', class: '9-A',  avatar: null, color: 'from-amber-400 to-orange-500',   online: false, starred: false },
  { id: 'c6', name: 'Class 10-A',     role: 'group',   members: 32,   avatar: null, color: 'from-indigo-500 to-purple-600',  online: true,  starred: true  },
  { id: 'c7', name: 'Class 9-B',      role: 'group',   members: 28,   avatar: null, color: 'from-teal-500 to-emerald-600',   online: false, starred: false },
  { id: 'c8', name: 'Ananya Patel',   role: 'student', class: '9-B',  avatar: null, color: 'from-violet-400 to-purple-500',  online: true,  starred: false },
];

const INIT_THREADS = {
  c1: [
    { id: 1, from: 'them', text: 'Good morning Sir! I had a doubt about Q5 in the homework.', time: hoursAgo(2), read: true },
    { id: 2, from: 'me',   text: 'Good morning Aarav! Sure, what is the doubt?', time: hoursAgo(1.9), read: true },
    { id: 3, from: 'them', text: 'For Q5, should we use factorisation or the quadratic formula?', time: hoursAgo(1.8), read: true },
    { id: 4, from: 'me',   text: 'Either works, but factorisation is faster here since the discriminant is a perfect square. Try it!', time: hoursAgo(1.5), read: true },
    { id: 5, from: 'them', text: 'Got it! Thank you so much Sir 🙏', time: minsAgo(5), read: false },
  ],
  c2: [
    { id: 1, from: 'them', text: 'Hello Sir, this is Priya Kumar, Aarav\'s mother. I wanted to check in about his progress.', time: daysAgo(1), read: true },
    { id: 2, from: 'me',   text: 'Hello Mrs. Kumar! Aarav is doing quite well. His scores have improved in the last two tests.', time: daysAgo(1), read: true },
    { id: 3, from: 'them', text: 'That is wonderful to hear! Is there anything I can do to support him at home?', time: minsAgo(30), read: false },
  ],
  c3: [
    { id: 1, from: 'them', text: 'Sir, I wasn\'t able to attend class today. Can I get the notes?', time: hoursAgo(3), read: true },
    { id: 2, from: 'me',   text: 'Yes Siya, I will share the PDF shortly. Please make sure you complete the in-class exercise as well.', time: hoursAgo(2.5), read: true },
    { id: 3, from: 'them', text: 'Sure Sir, thank you!', time: hoursAgo(2), read: true },
  ],
  c4: [
    { id: 1, from: 'them', text: 'Good evening Sir. Are parent-teacher meetings scheduled this week?', time: minsAgo(10), read: false },
  ],
  c5: [
    { id: 1, from: 'me',   text: 'Rohan, please submit the pending assignment by Friday.', time: daysAgo(2), read: true },
    { id: 2, from: 'them', text: 'Yes Sir, I will submit it by Thursday.', time: daysAgo(1), read: true },
  ],
  c6: [
    { id: 1, from: 'me',   text: '📚 Class 10-A: Reminder — Unit Test on Friday covers Chapters 1–5. Please revise all formulas.', time: hoursAgo(4), read: true },
    { id: 2, from: 'them', text: 'Thank you for the reminder Sir!', time: hoursAgo(3.5), read: true, sender: 'Aarav Kumar' },
    { id: 3, from: 'them', text: 'Sir, will derivation questions come?', time: hoursAgo(2), read: false, sender: 'Priya Singh' },
  ],
  c7: [
    { id: 1, from: 'me', text: 'Class 9-B: The practical lab session is tomorrow at 10 AM. Please bring your lab manuals.', time: daysAgo(1), read: true },
  ],
  c8: [
    { id: 1, from: 'them', text: 'Sir, I wanted to ask about the Science Fair project submission date.', time: hoursAgo(1), read: false },
  ],
};

// compute last message & unread count per contact
function buildMeta(threads) {
  const meta = {};
  Object.entries(threads).forEach(([id, msgs]) => {
    const last = msgs[msgs.length - 1];
    meta[id] = {
      lastMsg:     last?.text || '',
      lastTime:    last?.time || null,
      unreadCount: msgs.filter((m) => m.from === 'them' && !m.read).length,
    };
  });
  return meta;
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ contact, size = 10 }) {
  const sz = `w-${size} h-${size}`;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-white font-bold flex-shrink-0 relative`}>
      <span className={size >= 12 ? 'text-lg' : 'text-sm'}>{getInitials(contact.name)}</span>
      {contact.online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"/>
      )}
    </div>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({ contacts, onClose, onStart }) {
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">New Message</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-3">
            <Search size={15} className="text-gray-400"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students or parents…"
              className="flex-1 text-sm outline-none" autoFocus/>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filtered.map((c) => (
              <div key={c.id} onClick={() => setSelected(c.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selected === c.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'}`}>
                <Avatar contact={c} size={9}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{c.role}{c.class ? ` · ${c.class}` : ''}{c.child ? ` · Parent of ${c.child}` : ''}</p>
                </div>
                {selected === c.id && <Check size={16} className="text-indigo-600"/>}
              </div>
            ))}
          </div>
          <button disabled={!selected} onClick={() => { onStart(selected); onClose(); }}
            className="mt-4 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition-all">
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Messages = () => {
  const [threads, setThreads]           = useState(INIT_THREADS);
  const [meta, setMeta]                 = useState(() => buildMeta(INIT_THREADS));
  const [activeId, setActiveId]         = useState(null);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [input, setInput]               = useState('');
  const [compose, setCompose]           = useState(false);
  const [contacts, setContacts]         = useState(CONTACTS);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [annText, setAnnText]           = useState('');
  const [starred, setStarred]           = useState({});
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const activeContact = contacts.find((c) => c.id === activeId);
  const activeMessages = threads[activeId] || [];

  // Mark as read on open
  useEffect(() => {
    if (!activeId) return;
    setThreads((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).map((m) => ({ ...m, read: true })),
    }));
    setMeta((prev) => ({ ...prev, [activeId]: { ...prev[activeId], unreadCount: 0 } }));
  }, [activeId]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const filteredContacts = contacts.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === 'all' || c.role === filterRole;
    return matchSearch && matchRole;
  }).sort((a, b) => {
    const ta = meta[a.id]?.lastTime || 0;
    const tb = meta[b.id]?.lastTime || 0;
    return new Date(tb) - new Date(ta);
  });

  const totalUnread = Object.values(meta).reduce((s, m) => s + m.unreadCount, 0);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !activeId) return;
    const msg = { id: Date.now(), from: 'me', text, time: new Date(), read: true };
    setThreads((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }));
    setMeta((prev) => ({ ...prev, [activeId]: { lastMsg: text, lastTime: new Date(), unreadCount: 0 } }));
    setInput('');
    inputRef.current?.focus();
  };

  const sendAnnouncement = () => {
    const text = annText.trim();
    if (!text) return;
    const groups = contacts.filter((c) => c.role === 'group');
    const msg = { id: Date.now(), from: 'me', text: `📢 ${text}`, time: new Date(), read: true };
    const newThreads = { ...threads };
    const newMeta    = { ...meta };
    groups.forEach((g) => {
      newThreads[g.id] = [...(newThreads[g.id] || []), msg];
      newMeta[g.id]    = { lastMsg: msg.text, lastTime: new Date(), unreadCount: 0 };
    });
    setThreads(newThreads);
    setMeta(newMeta);
    setAnnText('');
    setAnnouncementMode(false);
  };

  const openChat = (id) => {
    setActiveId(id);
    setShowMobileChat(true);
  };

  const startCompose = (id) => {
    if (!threads[id]) setThreads((p) => ({ ...p, [id]: [] }));
    if (!meta[id])    setMeta((p) => ({ ...p, [id]: { lastMsg: '', lastTime: null, unreadCount: 0 } }));
    openChat(id);
  };

  const toggleStar = (id) => setStarred((p) => ({ ...p, [id]: !p[id] }));

  // Group messages by day for display
  const groupedMessages = [];
  let lastDay = null;
  activeMessages.forEach((m) => {
    const day = new Date(m.time).toDateString();
    if (day !== lastDay) { groupedMessages.push({ type: 'divider', label: dayLabel(m.time) }); lastDay = day; }
    groupedMessages.push({ type: 'msg', ...m });
  });

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <style>{`
        .msg-bubble-me   { background: linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border-radius:1.25rem 1.25rem 0.25rem 1.25rem; }
        .msg-bubble-them { background:#f3f4f6; color:#111827; border-radius:1.25rem 1.25rem 1.25rem 0.25rem; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalUnread > 0 ? <span className="text-indigo-600 font-semibold">{totalUnread} unread</span> : 'All caught up'} · Chat with students & parents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAnnouncementMode(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-colors">
            <Bell size={16}/> Announce
          </button>
          <button onClick={() => setCompose(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all">
            <Plus size={18}/> New Message
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-0">

        {/* ── Contacts Sidebar ─────────────────────────────────────────── */}
        <div className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${showMobileChat ? 'hidden sm:flex' : 'flex'}`}>
          {/* Search & Filter */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={15} className="text-gray-400"/>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…" className="flex-1 text-sm bg-transparent outline-none text-gray-700"/>
              {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400"/></button>}
            </div>
            <div className="flex gap-1.5">
              {[['all','All'],['student','Students'],['parent','Parents'],['group','Groups']].map(([v,l]) => (
                <button key={v} onClick={() => setFilterRole(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterRole === v ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto scrollbar-hidden divide-y divide-gray-50">
            {filteredContacts.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">No conversations found</div>
            )}
            {filteredContacts.map((c) => {
              const m       = meta[c.id] || {};
              const isActive = activeId === c.id;
              const roleBadge = c.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                                c.role === 'group'  ? 'bg-indigo-100 text-indigo-700' :
                                                      'bg-blue-100 text-blue-700';
              return (
                <div key={c.id} onClick={() => openChat(c.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                    isActive ? 'bg-indigo-50 border-r-2 border-indigo-500' : 'hover:bg-gray-50'
                  }`}>
                  <Avatar contact={c}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>{c.name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(m.lastTime)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate max-w-[140px]">{m.lastMsg || 'No messages yet'}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {starred[c.id] && <Star size={11} className="text-amber-400 fill-amber-400"/>}
                        {m.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{m.unreadCount}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${roleBadge}`}>
                      {c.role}{c.class ? ` · ${c.class}` : ''}{c.members ? ` · ${c.members} members` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Chat Area ────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showMobileChat && !activeId ? 'hidden sm:flex' : 'flex'}`}>
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen size={36} className="text-indigo-300"/>
              </div>
              <h3 className="text-lg font-bold text-gray-700">Select a Conversation</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">Choose a student or parent from the left to start or continue a conversation.</p>
              <button onClick={() => setCompose(true)}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                <Plus size={16}/> New Message
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
                <button onClick={() => { setShowMobileChat(false); setActiveId(null); }}
                  className="sm:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20}/></button>
                <Avatar contact={activeContact} size={10}/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{activeContact.name}</p>
                  <p className="text-xs text-gray-400">
                    {activeContact.online ? <span className="text-green-500 font-medium">● Online</span> : 'Offline'}
                    {activeContact.class ? ` · Class ${activeContact.class}` : ''}
                    {activeContact.child ? ` · ${activeContact.child}` : ''}
                    {activeContact.members ? ` · ${activeContact.members} members` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleStar(activeId)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    {starred[activeId] ? <Star size={18} className="text-amber-400 fill-amber-400"/> : <StarOff size={18}/>}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Phone size={18}/></button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><Video size={18}/></button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><MoreVertical size={18}/></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-hidden px-5 py-4 space-y-1 bg-gray-50/50">
                {groupedMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No messages yet. Say hello! 👋
                  </div>
                )}
                {groupedMessages.map((item, idx) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={`div-${idx}`} className="flex items-center gap-3 py-3">
                        <hr className="flex-1 border-gray-200"/>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50/50 px-2">{item.label}</span>
                        <hr className="flex-1 border-gray-200"/>
                      </div>
                    );
                  }
                  const isMe = item.from === 'me';
                  return (
                    <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {item.sender && !isMe && (
                          <span className="text-xs text-indigo-600 font-semibold mb-1 ml-1">{item.sender}</span>
                        )}
                        <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isMe ? 'msg-bubble-me' : 'msg-bubble-them'}`}>
                          {item.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-400">{formatFull(item.time)}</span>
                          {isMe && (
                            item.read
                              ? <CheckCheck size={13} className="text-indigo-400"/>
                              : <Check size={13} className="text-gray-400"/>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors"><Paperclip size={18}/></button>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors"><Image size={18}/></button>
                  </div>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Message ${activeContact.name}…`}
                    className="flex-1 bg-transparent text-sm text-gray-800 resize-none outline-none max-h-28 overflow-y-auto placeholder:text-gray-400"
                    style={{ lineHeight: '1.5' }}
                  />
                  <button onClick={sendMessage} disabled={!input.trim()}
                    className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-all shadow-md">
                    <Send size={16}/>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 pl-2">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Announcement Modal ─────────────────────────────────────────── */}
      {announcementMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAnnouncementMode(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold">Send Announcement</h2>
                <p className="text-white/80 text-xs mt-0.5">Broadcast to all class groups</p>
              </div>
              <button onClick={() => setAnnouncementMode(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Recipients</label>
                <div className="flex flex-wrap gap-2">
                  {contacts.filter((c) => c.role === 'group').map((g) => (
                    <span key={g.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold">{g.name}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Announcement *</label>
                <textarea rows={4} value={annText} onChange={(e) => setAnnText(e.target.value)}
                  placeholder="e.g. Reminder: Unit test on Friday. Bring calculators and ID cards."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all"/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAnnouncementMode(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
                <button disabled={!annText.trim()} onClick={sendAnnouncement}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition-all">
                  📢 Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Compose Modal ─────────────────────────────────────────────── */}
      {compose && (
        <ComposeModal
          contacts={contacts}
          onClose={() => setCompose(false)}
          onStart={startCompose}
        />
      )}
    </div>
  );
};

export default Messages;