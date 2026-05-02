// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext";
import s from "./Auth.module.css";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  year: z.string().min(1, "Year is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      year: "1st Year",
    },
  });

  async function onSubmit(data) {
    setAuthError("");
    setLoading(true);
    try {
      await authRegister(data.name.trim(), data.email, data.password, data.year);
      navigate("/");
    } catch (err) {
      console.error("Supabase register error:", err);
      setAuthError(err.message || "Registration failed. Please try again.");
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
          <Link to="/login" className={s.tab}>
            Login
          </Link>
          <Link to="/register" className={`${s.tab} ${s.tabActive}`}>
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
          <div className="field">
            <label>Full Name</label>
            <input placeholder="Your full name" {...register("name")} />
            {errors.name && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.name.message}</div>}
          </div>
          
          <div className="field">
            <label>College Email</label>
            <input
              type="email"
              placeholder="yourname@cb.amrita.edu"
              {...register("email")}
            />
            {errors.email && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email.message}</div>}
          </div>
          
          <div className="field">
            <label>Year</label>
            <select {...register("year")}>
              {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {errors.year && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.year.message}</div>}
          </div>
          
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              {...register("password")}
            />
            {errors.password && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password.message}</div>}
          </div>
          
          {authError && <div className={s.error}>{authError}</div>}
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <>
                <Loader size={16} className={s.spin} /> Creating account…
              </>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <p className={s.switch}>
          Already have an account?{" "}
          <Link to="/login" className={s.switchLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
