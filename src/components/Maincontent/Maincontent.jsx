import { useContext, useEffect, useRef, useState } from "react";
import "./Maincontent.css";
import { assets } from "../../assets/assets";
import { ChatContext } from "../../context/chatContext";
import SkeletonMessage from "../Skeleton/SkeletonMessage";
import ReactMarkdown from "react-markdown";
import AuthModal from "../AuthModal/AuthModal";

const suggestions = [
  ["Suggest beautiful places to see on an upcoming road trip", "compass_icon"],
  ["Briefly summarize this concept: urban planning", "bulb_icon"],
  ["Brainstorm team bonding activities for our work retreat", "message_icon"],
  ["Tell me about React JS and React Native", "code_icon"],
];

const formatTime = (timestamp) =>
  typeof timestamp === "number"
    ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(timestamp)
    : "";

const ThemeIcon = ({ theme }) => {
  if (theme === "dark") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.1A8.5 8.5 0 0 1 8.9 3.5 8.5 8.5 0 1 0 20.5 15.1Z" /></svg>;
  if (theme === "system") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
};

const Maincontent = () => {
  const { messages, onSent, loading, error, input, setInput, retryLastResponse, stopGeneration, themeMode, setThemeMode, user, authLoading, signIn, signUp, signOut } = useContext(ChatContext);
  const bottomRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const copyResponse = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard access can be unavailable in non-secure browser contexts.
    }
  };

  return (
    <main className="main">
      <header className="nav">
        <p>Gemini</p>
        <div className="nav-actions">
          <div className="theme-menu">
            <button className="theme-icon" onClick={() => setThemeMode({ light: "dark", dark: "system", system: "light" }[themeMode])} aria-label={`Current theme: ${themeMode}. Click to change theme.`} title={`Theme: ${themeMode}. Click to change.`}>
              <ThemeIcon theme={themeMode} />
            </button>
          </div>
          {user ? (
            <div className="account-menu">
              <button className="profile-button" onClick={() => setAccountOpen((open) => !open)} aria-label="Open account menu" aria-expanded={accountOpen}>
                <img src={assets.user_icon} alt="Profile" />
                <span className="online-indicator" aria-hidden="true" />
              </button>
              {accountOpen && <div className="account-dropdown" role="menu">
                <p className="account-label">Signed in as</p>
                <p className="account-email" title={user.email}>{user.email}</p>
                <div className="account-divider" />
                <button className="logout-button" role="menuitem" onClick={() => { signOut(); setAccountOpen(false); }}>Sign out</button>
              </div>}
            </div>
          ) : (
            <button className="signin-button" onClick={() => setAuthOpen(true)} disabled={authLoading}>
              {authLoading ? "Loading" : "Sign in"}
            </button>
          )}
        </div>
      </header>

      <div className="main-container">
        {messages.length === 0 ? (
          <section aria-label="Suggested prompts">
            <div className="greet"><p><span>Hello, Dev.</span></p><p>How can I help you today?</p></div>
            <div className="cards">
              {suggestions.map(([prompt, icon]) => (
                <button className="card" key={prompt} onClick={() => onSent(prompt)}>
                  <span>{prompt}</span><img src={assets[icon]} alt="" />
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="result" aria-live="polite">
            {messages.map((message, index) => (
              !message.streaming || message.text ? <article key={`${message.role}-${index}`} className={`chat-row ${message.role}`}>
                <div className="message-avatar" aria-hidden="true">
                  <img src={message.role === "user" ? assets.user_icon : assets.gemini_icon} alt="" />
                </div>
                <div className="message-content">
                  <div className="message-meta">
                    <span>{message.role === "user" ? "You" : "Gemini"}</span>
                    {formatTime(message.createdAt) && <time>{formatTime(message.createdAt)}</time>}
                  </div>
                  <div className="text">
                    <ReactMarkdown components={{
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                    }}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                  {message.role === "model" && !message.streaming && message.text && (
                    <button className="message-action" onClick={() => copyResponse(message.text, index)}>
                      {copiedIndex === index ? "✓ Copied" : "Copy response"}
                    </button>
                  )}
                </div>
              </article> : null
            ))}
            {loading && messages.at(-1)?.text === "" && <SkeletonMessage />}
            {!loading && messages.at(-1)?.role === "user" && (
              <div className="interrupted-response">
                <span>Response interrupted before it was completed.</span>
                <button onClick={retryLastResponse}>Regenerate response</button>
              </div>
            )}
            {error && <div className="error-message" role="alert">{error}<button onClick={retryLastResponse}>Retry</button></div>}
            <div ref={bottomRef} />
          </section>
        )}

        <form className="main-bottom" onSubmit={(event) => { event.preventDefault(); onSent(); }}>
          <div className="search-box">
            <input type="text" placeholder="Ask Gemini" value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} aria-label="Message Gemini" />
            <div>
              <button type="button" className="icon-button" aria-label="Attachments are not available yet" title="Attachments coming soon" disabled><img src={assets.gallery_icon} alt="" /></button>
              <button type="button" className="icon-button" aria-label="Voice input is not available yet" title="Voice input coming soon" disabled><img src={assets.mic_icon} alt="" /></button>
              {loading ? <button type="button" className="stop-button" onClick={stopGeneration}>Stop</button> : <button type="submit" className="icon-button sendbtn" aria-label="Send message" disabled={!input.trim()}><img src={assets.send_icon} alt="" /></button>}
            </div>
          </div>
          <p className="bottom-info">Gemini may display inaccurate information. Double-check important responses.</p>
        </form>
      </div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSignIn={signIn} onSignUp={signUp} />}
    </main>
  );
};

export default Maincontent;
