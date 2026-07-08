// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider }    from "./context/AuthContext";
import ProtectedRoute      from "./components/ProtectedRoute";
import Navbar              from "./components/Navbar";
import Login               from "./pages/Login";
import Register            from "./pages/Register";
import Home                from "./pages/Home";
import Saved               from "./pages/Saved";
import Trending            from "./pages/Trending";
import Curriculum          from "./pages/Curriculum";
import Profile             from "./pages/Profile";
import Requests            from "./pages/Requests";
import Search              from "./pages/Search";
import NotFound            from "./pages/NotFound";
import ForgotPassword      from "./pages/ForgotPassword";
import ResetPassword       from "./pages/ResetPassword";
import "./styles/global.css";

function Layout() {
  return <>
    <Navbar />
    <Outlet />
  </>;
}

import { supabase } from "./supabase";

export default function App() {
  useEffect(() => {
    // If user clicked email reset password link, redirect to reset-password page preserving the hash tokens
    if (window.location.hash.includes("type=recovery") && window.location.pathname !== "/reset-password") {
      window.location.replace("/reset-password" + window.location.hash);
    }
  }, []);

  if (!supabase) {
    return (
      <div style={{ padding: "50px", textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        <h1>⚠️ Vercel Configuration Error</h1>
        <p>The Supabase Environment Variables are missing in Vercel!</p>
        <p>Please go to Vercel Settings -&gt; Environment Variables, ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are added, check all boxes (Production, Preview, Development), and Redeploy.</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          <Route element={<Layout />}>
            <Route path="/"           element={<Home />} />
            <Route path="/search"     element={<Search />} />
            <Route path="/trending"   element={<Trending />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/requests"   element={<Requests />} />
          </Route>

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/saved"      element={<Saved />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
