import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  const { login, signup, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
        <button className="ghost" onClick={() => setIsSignup((previous) => !previous)}>
          {isSignup ? "Already have an account? Login" : "New here? Create account"}
        </button>
      </section>
    </main>
  );
};

export default AuthPage;
