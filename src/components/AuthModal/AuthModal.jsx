import { useState } from "react";
import "./AuthModal.css";

const AuthModal = ({ onClose, onSignIn, onSignUp }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    const message = mode === "signin" ? await onSignIn(email, password) : await onSignUp(email, password);
    setSubmitting(false);
    if (message) setStatus(message);
    else if (mode === "signin") onClose();
    else setStatus("Check your inbox to confirm your email, then sign in.");
  };

  return <div className="auth-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
      <p className="auth-kicker">Gemini Clone</p>
      <h2 id="auth-title">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
      <p className="auth-copy">{mode === "signin" ? "Sign in to keep your account ready for cloud sync." : "Use your email and a secure password to get started."}</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Password
          <span className="password-field">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength="6" required />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.3 5.2 9.3 8-0 .9-.4 1.9-1.1 2.9M6.2 6.2C3.8 8 2.7 10.4 2.7 12c0 2.8 3.8 8 9.3 8 1.7 0 3.2-.5 4.5-1.3M14.1 14.1A3 3 0 0 1 9.9 9.9" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.7 12S6.5 4 12 4s9.3 8 9.3 8-3.8 8-9.3 8S2.7 12 2.7 12Z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </span>
        </label>
        {status && <p className="auth-status" role="alert">{status}</p>}
        <button className="auth-submit" disabled={submitting}>{submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setStatus(""); }}>
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </section>
  </div>;
};

export default AuthModal;
