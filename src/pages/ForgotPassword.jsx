// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext";
import s from "./Auth.module.css";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(data) {
    setAuthError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await resetPassword(data.email);
      setSuccessMsg("Reset link sent! Please check your institutional inbox.");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Supabase password reset error:", err);
      const msg = err.message || JSON.stringify(err) || "Failed to send reset link.";
      setAuthError(msg);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>
          <div className={s.logoMark}>
            <span className={s.logoA}>Amrita</span>
            <span className={s.logoH}>Hub</span>
          </div>
          <div className={s.logoSub}>Reset your password</div>
        </div>

        {successMsg ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "12px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600 }}>
              {successMsg}
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", margin: "0 0 10px", lineHeight: 1.5 }}>
              Enter your registered email and we'll send you a password recovery link.
            </p>

            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="yourname@cb.amrita.edu"
                {...register("email")}
              />
              {errors.email && <div className={s.errorText} style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email.message}</div>}
            </div>

            {authError && <div className={s.error}>{authError}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader size={16} className={s.spin} /> Sending link…
                </>
              ) : (
                "Send Reset Link →"
              )}
            </button>

            <p className={s.switch}>
              Remembered password?{" "}
              <Link to="/login" className={s.switchLink}>
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
