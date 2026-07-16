import { useContext, useMemo, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { ChatContext } from "../../context/chatContext";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const { chats, activeChatId, setActiveChatId, startNewChat, deleteChat, renameChat, togglePinChat, toggleArchiveChat, clearAllChats } = useContext(ChatContext);

  const visibleChats = useMemo(() => chats
    .filter((chat) => chat.messages.length > 0 && chat.archived === showArchived && chat.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt), [chats, query, showArchived]);

  const confirmDelete = (chat) => {
    if (window.confirm(`Delete “${chat.title}”? This cannot be undone.`)) deleteChat(chat.id);
  };

  return <aside className={`sidebar ${extended ? "extended" : ""}`} aria-label="Chat navigation">
    <div className="top">
      <button className="icon-button menu" onClick={() => setExtended((value) => !value)} aria-label="Toggle sidebar"><img src={assets.menu_icon} alt="" /></button>
      <button className="new-chat" onClick={() => { startNewChat(); setExtended(false); }}><img src={assets.plus_icon} alt="" />{extended && <span>New chat</span>}</button>
      {extended && <nav className="recent" aria-label="Recent chats">
        <div className="chat-tools"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats" aria-label="Search chats" /><button onClick={() => setShowArchived((value) => !value)}>{showArchived ? "Active" : "Archived"}</button></div>
        <div className="recent-heading"><p className="recent-title">{showArchived ? "Archived" : "Recent"}</p>{!showArchived && chats.some((chat) => chat.messages.length) && <button className="clear-all" onClick={() => { if (window.confirm("Clear all chats? This cannot be undone.")) clearAllChats(); }}>Clear all</button>}</div>
        {visibleChats.map((chat) => <div className={`recent-entry ${chat.id === activeChatId ? "active" : ""}`} key={chat.id}>
          {editingId === chat.id ? <input className="rename-input" autoFocus value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} onBlur={() => { renameChat(chat.id, draftTitle); setEditingId(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setEditingId(null); }} /> : <button className="chat-select" onClick={() => setActiveChatId(chat.id)} title={chat.title}><img src={assets.message_icon} alt="" /><span>{chat.pinned ? "★ " : ""}{chat.title}</span></button>}
          <div className="chat-actions">
            <button onClick={() => togglePinChat(chat.id)} title={chat.pinned ? "Unpin chat" : "Pin chat"}>{chat.pinned ? "★" : "☆"}</button>
            <button onClick={() => { if (editingId !== chat.id) { setEditingId(chat.id); setDraftTitle(chat.title); } }} title="Rename chat">✎</button>
            <button onClick={() => toggleArchiveChat(chat.id)} title={chat.archived ? "Restore chat" : "Archive chat"}>{chat.archived ? "↩" : "⌄"}</button>
            <button className="delete-chat" onClick={() => confirmDelete(chat)} title="Delete chat">×</button>
          </div>
        </div>)}
        {!visibleChats.length && <p className="no-chats">No chats found.</p>}
      </nav>}
    </div>
    <div className="bottom"><span className="bottom-item"><img src={assets.question_icon} alt="" />{extended && "Help"}</span><span className="bottom-item"><img src={assets.history_icon} alt="" />{extended && "Activity"}</span></div>
  </aside>;
};

export default Sidebar;
