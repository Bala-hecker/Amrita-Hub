// src/pages/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext";
import s from "./Auth.module.css";

const resetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetSchema),
  });

  async function onSubmit(data) {
    setAuthError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await updatePassword(data.password);
      setSuccessMsg("Password successfully reset! Redirecting to login...");
      setLoading(false);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setLoading(false);
      console.error("Supabase password update error:", err);
      const msg = err.message || JSON.stringify(err) || "Failed to update password.";
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
          <div className={s.logoSub}>Enter new password</div>
        </div>

        {successMsg ? (
          <div style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669", padding: "12px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 600, textAlign: "center" }}>
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && <div className={s.errorText} style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password.message}</div>}
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <div className={s.errorText} style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.confirmPassword.message}</div>}
            </div>

            {authError && <div className={s.error}>{authError}</div>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader size={16} className={s.spin} /> Saving password…
                </>
              ) : (
                "Update Password →"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
