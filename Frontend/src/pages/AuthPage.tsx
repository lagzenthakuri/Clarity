import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const { login, signup, googleLogin, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError("");

    try {
      if (isSignup) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch {
      setError("Authentication failed. Check your credentials and try again.");
    }
  };

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google authentication failed. Please try again.");
            return;
          }

          setError("");
          try {
            await googleLogin(response.credential);
          } catch {
            setError("Google authentication failed. Please try again.");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: isSignup ? "signup_with" : "signin_with",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
    };
  }, [googleLogin, isSignup]);

  return (
    <main className="centered">
      <section className="card auth-card">
        <h1>Clarity</h1>
        <p>Track your money with less friction.</p>
        <form className="form-grid" onSubmit={submit}>
          {isSignup && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
          </button>
        </form>
        <div className="auth-divider">or</div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div className="google-btn-wrap" ref={googleButtonRef} />
        ) : (
          <p className="muted">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
        )}
        <button className="ghost" onClick={() => setIsSignup((previous) => !previous)}>
          {isSignup ? "Already have an account? Login" : "New here? Create account"}
        </button>
      </section>
    </main>
  );
};

export default AuthPage;
