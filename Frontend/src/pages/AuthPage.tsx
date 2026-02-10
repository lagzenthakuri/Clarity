import { motion, AnimatePresence } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const AuthPage = () => {
  const { login, signup, googleLogin, loading } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
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
        showSuccessToast("Account created successfully.");
      } else {
        await login(email, password);
        showSuccessToast("Logged in successfully.");
      }
    } catch {
      setError("Authentication failed. Check your credentials and try again.");
      showErrorToast("Authentication failed.");
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
            showErrorToast("Google authentication failed.");
            return;
          }

          setError("");
          try {
            await googleLogin(response.credential);
            showSuccessToast("Logged in with Google successfully.");
          } catch {
            setError("Google authentication failed. Please try again.");
            showErrorToast("Google authentication failed.");
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: isSignup ? "signup_with" : "signin_with",
        width: googleButtonRef.current.offsetWidth || 320,
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
  }, [googleLogin, isSignup, showErrorToast, showSuccessToast]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-dark-900 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 blur-[120px] rounded-full" />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card w-full max-w-[440px] flex flex-col gap-6 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            Clarity
          </motion.h1>
          <p className="text-dark-200 text-sm">Track your money with less friction.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <AnimatePresence mode="popLayout" initial={false}>
            {isSignup && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 4 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex flex-col gap-1.5 overflow-hidden"
              >
                <label className="text-xs font-semibold text-dark-200 uppercase tracking-wider ml-1">Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="John Doe"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-dark-200 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-dark-200 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-danger text-xs font-medium bg-danger/10 p-2.5 rounded-lg border border-danger/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="btn-primary w-full mt-2 relative overflow-hidden group"
            disabled={loading}
          >
            <span className="relative z-10 font-bold uppercase tracking-widest text-xs">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isSignup ? "Create account" : "Login to Clarity"}
            </span>
          </motion.button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-dark-200/10"></div>
          <span className="flex-shrink mx-4 text-[10px] text-dark-200/40 uppercase tracking-[0.2em]">Social Access</span>
          <div className="flex-grow border-t border-dark-200/10"></div>
        </div>

        <div className="min-h-[44px] flex flex-col items-center">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center w-full" ref={googleButtonRef} />
          ) : (
            <p className="text-[10px] text-dark-200/40 text-center italic leading-relaxed">
              Google authentication is currently unavailable.
            </p>
          )}
        </div>

        <button
          className="text-xs font-semibold text-dark-200 hover:text-primary transition-colors py-2"
          onClick={() => setIsSignup((previous) => !previous)}
        >
          {isSignup ? "Already have an account? Login here" : "Don't have an account? Create one"}
        </button>
      </motion.section>
    </main>
  );
};

export default AuthPage;
