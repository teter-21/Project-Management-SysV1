import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { LogIn } from "lucide-react";

import { useAuth } from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);

      const destination = location.state?.from;
      const target =
        destination?.pathname?.startsWith("/") &&
        !destination.pathname.startsWith("//")
          ? destination.pathname +
            (destination.search || "") +
            (destination.hash || "")
          : "/dashboard";

      navigate(target, { replace: true });
    } catch (err) {
      console.error("Sign-in failed:", err.message);

      setError(
        "Unable to sign in. Check your credentials, " +
          "email verification, or connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo">T</div>
          <h1>TaskFlow</h1>
        </div>

        <div className="auth-heading">
          <h2>Welcome back</h2>
          <p>Sign in to manage your projects.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="auth-submit" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? "Signing you in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
