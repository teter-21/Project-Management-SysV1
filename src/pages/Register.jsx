import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus } from "lucide-react";

import { useAuth } from "../hooks/useAuth";

function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setMessage("");

    if (form.fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await signUp(
        form.email.trim(),
        form.password,
        form.fullName.trim(),
      );

      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setMessage(
          "Registration request received. If email " +
            "confirmation is required, check your inbox " +
            "and verify your address before signing in.",
        );

        setForm({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      console.error("Registration failed:", err.message);

      setError(
        "Registration could not be completed. " +
          "Please review your details and try again.",
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
          <h2>Create your account</h2>
          <p>Start managing your projects with TaskFlow.</p>
        </div>

        {message ? (
          <div className="auth-success" role="status">
            <p>{message}</p>
            <Link to="/login">Go to Sign In</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />

            <label htmlFor="register-confirm">Confirm password</label>
            <input
              id="register-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" className="auth-submit" disabled={submitting}>
              <UserPlus size={18} />
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
