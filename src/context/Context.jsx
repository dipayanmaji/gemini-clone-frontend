import { useEffect, useRef, useState } from "react";
import streamResponse from "../config/gemini";
import { supabase } from "../config/supabase";
import { ChatContext } from "./chatContext";

const STORAGE_KEY = "gemini-clone-chats";
const THEME_STORAGE_KEY = "gemini-clone-theme";

const createChat = () => ({
  id: crypto.randomUUID(),
  title: "New chat",
  messages: [],
  pinned: false,
  archived: false,
  updatedAt: Date.now(),
});

const loadChats = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.length
      ? saved.map((chat) => ({ ...chat, pinned: Boolean(chat.pinned), archived: Boolean(chat.archived) }))
      : [createChat()];
  } catch {
    return [createChat()];
  }
};

const loadTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return ["light", "dark", "system"].includes(savedTheme) ? savedTheme : "system";
};

const toCloudChats = (userId, chats) => chats.map((chat) => ({
  id: chat.id,
  user_id: userId,
  title: chat.title,
  pinned: Boolean(chat.pinned),
  archived: Boolean(chat.archived),
  created_at: new Date(chat.createdAt || Date.now()).toISOString(),
  updated_at: new Date(chat.updatedAt || Date.now()).toISOString(),
}));

const syncChatsToCloud = async (userId, chats) => {
  const chatsWithMessages = chats.filter((chat) => chat.messages.some((message) => message.text?.trim()));
  if (!supabase || !chatsWithMessages.length) return;
  const { error: chatError } = await supabase.from("chats").upsert(toCloudChats(userId, chatsWithMessages));
  if (chatError) throw chatError;

  for (const chat of chatsWithMessages) {
    const { error: deleteError } = await supabase.from("messages").delete().eq("chat_id", chat.id);
    if (deleteError) throw deleteError;
    if (chat.messages.length) {
      const { error: messageError } = await supabase.from("messages").insert(
        chat.messages.filter((message) => message.text?.trim()).map((message) => ({
          chat_id: chat.id,
          role: message.role,
          content: message.text,
          created_at: new Date(message.createdAt || Date.now()).toISOString(),
        })),
      );
      if (messageError) throw messageError;
    }
  }
};

const fromCloudChats = (cloudChats) => cloudChats.map((chat) => ({
  id: chat.id,
  title: chat.title,
  pinned: Boolean(chat.pinned),
  archived: Boolean(chat.archived),
  createdAt: new Date(chat.created_at).getTime(),
  updatedAt: new Date(chat.updated_at).getTime(),
  messages: [...(chat.messages || []).filter((message) => message.content?.trim())].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((message) => ({
    role: message.role,
    text: message.content,
    createdAt: new Date(message.created_at).getTime(),
  })),
}));

const ContextProvider = ({ children }) => {
  const initialChats = useRef(loadChats());
  const chatsRef = useRef(initialChats.current);
  const [chats, setChats] = useState(initialChats.current);
  const [activeChatId, setActiveChatId] = useState(initialChats.current[0].id);
  const [input, setInput] = useState("");
  const [themeMode, setThemeMode] = useState(loadTheme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [cloudReady, setCloudReady] = useState(false);
  const controllerRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];
  const userId = user?.id;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      document.documentElement.dataset.theme = themeMode === "system"
        ? (mediaQuery.matches ? "dark" : "light")
        : themeMode;
    };
    applyTheme();
    if (themeMode === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [themeMode]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return undefined; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    if (!userId || !supabase) { setCloudReady(false); return undefined; }

    const loadCloudChats = async () => {
      setCloudReady(false);
      const { data, error: cloudError } = await supabase
        .from("chats")
        .select("id, title, pinned, archived, created_at, updated_at, messages(id, role, content, created_at)")
        .order("updated_at", { ascending: false });

      if (!active) return;
      if (cloudError) {
        const migrationMissing = cloudError.code === "42703" || /pinned|archived/i.test(cloudError.message || "");
        setError(migrationMissing
          ? "Cloud sync needs the latest database update. Run Supabase migration 002, then refresh."
          : "Cloud chat sync is unavailable. Your chats are still saved locally.");
        return;
      }

      if (data.length) {
        const restoredChats = fromCloudChats(data).filter((chat) => chat.messages.length > 0);
        const freshChat = createChat();
        setChats([freshChat, ...restoredChats]);
        setActiveChatId(freshChat.id);
      } else {
        try {
          await syncChatsToCloud(userId, chatsRef.current);
        } catch {
          setError("We could not migrate your local chats to the cloud yet.");
        }
      }
      if (active) setCloudReady(true);
    };

    loadCloudChats();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId || !cloudReady) return undefined;
    const timer = window.setTimeout(() => {
      syncChatsToCloud(userId, chats).catch(() => {
        setError("Cloud sync failed. Your latest chat is still saved on this device.");
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [chats, userId, cloudReady]);

  const signIn = async (email, password) => {
    if (!supabase) return "Supabase is not configured.";
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    return authError?.message || "";
  };

  const signUp = async (email, password) => {
    if (!supabase) return "Supabase is not configured.";
    const { error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    return authError?.message || "";
  };

  const signOut = async () => {
    controllerRef.current?.abort();
    setCloudReady(false);
    const anonymousChat = createChat();
    setChats([anonymousChat]);
    setActiveChatId(anonymousChat.id);
    setInput("");
    setError("");
    localStorage.removeItem(STORAGE_KEY);
    if (supabase) await supabase.auth.signOut();
  };

  const updateChat = (chatId, updater) => {
    setChats((currentChats) =>
      currentChats.map((chat) => (chat.id === chatId ? updater(chat) : chat)),
    );
  };

  const startNewChat = () => {
    if (loading) return;
    const existingEmptyChat = chats.find((chat) => chat.messages.length === 0);
    if (existingEmptyChat) return setActiveChatId(existingEmptyChat.id);
    const chat = createChat();
    setChats((currentChats) => [chat, ...currentChats]);
    setActiveChatId(chat.id);
    setInput("");
    setError("");
  };

  const deleteChat = (chatId) => {
    const deletingActiveChat = chatId === activeChatId;
    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    const nextChats = remainingChats.length ? remainingChats : [createChat()];

    if (deletingActiveChat) {
      controllerRef.current?.abort();
      setActiveChatId(nextChats[0].id);
      setInput("");
      setError("");
    }
    setChats(nextChats);
    if (user && supabase) {
      supabase.from("chats").delete().eq("id", chatId).then(({ error: deleteError }) => {
        if (deleteError) setError("The chat was removed locally but could not be deleted from the cloud.");
      });
    }
  };

  const renameChat = (chatId, title) => {
    const cleanTitle = title.trim().slice(0, 200);
    if (cleanTitle) updateChat(chatId, (chat) => ({ ...chat, title: cleanTitle, updatedAt: Date.now() }));
  };

  const togglePinChat = (chatId) => {
    updateChat(chatId, (chat) => ({ ...chat, pinned: !chat.pinned, updatedAt: Date.now() }));
  };

  const toggleArchiveChat = (chatId) => {
    const chat = chats.find((item) => item.id === chatId);
    if (!chat) return;
    const willArchive = !chat.archived;
    updateChat(chatId, (item) => ({ ...item, archived: willArchive, updatedAt: Date.now() }));
    if (willArchive && chatId === activeChatId) {
      const nextChat = chats.find((item) => item.id !== chatId && !item.archived) || createChat();
      if (!chats.some((item) => item.id === nextChat.id)) setChats((current) => [nextChat, ...current]);
      setActiveChatId(nextChat.id);
    }
  };

  const clearAllChats = () => {
    controllerRef.current?.abort();
    const freshChat = createChat();
    setChats([freshChat]);
    setActiveChatId(freshChat.id);
    setInput("");
    setError("");
    if (user && supabase) {
      supabase.from("chats").delete().eq("user_id", user.id).then(({ error: clearError }) => {
        if (clearError) setError("Chats were cleared locally but could not be cleared from the cloud.");
      });
    }
  };

  const requestReply = async (chatId, history) => {
    controllerRef.current = new AbortController();
    setLoading(true);
    setError("");
    updateChat(chatId, (chat) => ({
      ...chat,
      messages: [...history, { role: "model", text: "", streaming: true, createdAt: Date.now() }],
      updatedAt: Date.now(),
    }));

    try {
      await streamResponse(history, controllerRef.current.signal, (chunk) => {
        updateChat(chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map((message, index) =>
            index === chat.messages.length - 1
              ? { ...message, text: message.text + chunk }
              : message,
          ),
        }));
      });
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message);
    } finally {
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((message) => ({ ...message, streaming: false })),
        updatedAt: Date.now(),
      }));
      controllerRef.current = null;
      setLoading(false);
    }
  };

  const onSent = async (prompt) => {
    const text = (prompt || input).trim();
    if (!text || loading || !activeChat) return;

    const userMessage = { role: "user", text, createdAt: Date.now() };
    const history = [...messages, userMessage];
    const chatId = activeChat.id;
    if (activeChat.messages.length === 0) {
      updateChat(chatId, (chat) => ({
        ...chat,
        title: text.length > 36 ? `${text.slice(0, 36)}…` : text,
      }));
    }
    setInput("");
    await requestReply(chatId, history);
  };

  const retryLastResponse = async () => {
    if (loading || !activeChat) return;
    const lastUserIndex = messages.map((message) => message.role).lastIndexOf("user");
    if (lastUserIndex === -1) return;
    await requestReply(activeChat.id, messages.slice(0, lastUserIndex + 1));
  };

  const stopGeneration = () => controllerRef.current?.abort();

  const value = {
    chats,
    activeChatId,
    setActiveChatId,
    activeChat,
    messages,
    input,
    setInput,
    themeMode,
    setThemeMode,
    loading,
    error,
    user,
    authLoading,
    cloudReady,
    signIn,
    signUp,
    signOut,
    onSent,
    startNewChat,
    deleteChat,
    renameChat,
    togglePinChat,
    toggleArchiveChat,
    clearAllChats,
    retryLastResponse,
    stopGeneration,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ContextProvider;
