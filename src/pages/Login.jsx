// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext";
import s from "./Auth.module.css";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data) {
    setAuthError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      console.error("Supabase login error:", err);
      setAuthError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
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
          <div className={s.logoSub}>Amrita School of Engineering · CSE</div>
        </div>

        <div className={s.tabs}>
          <Link to="/login" className={`${s.tab} ${s.tabActive}`}>
            Login
          </Link>
          <Link to="/register" className={s.tab}>
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="yourname@cb.amrita.edu"
              {...register("email")}
            />
            {errors.email && <div className={s.errorText} style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email.message}</div>}
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && <div className={s.errorText} style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password.message}</div>}
          </div>
          
          {authError && <div className={s.error}>{authError}</div>}
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <>
                <Loader size={16} className={s.spin} /> Signing in…
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <p className={s.switch}>
          New here?{" "}
          <Link to="/register" className={s.switchLink}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
