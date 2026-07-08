// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid) => {
    try {
      let token = process.env.REACT_APP_SUPABASE_ANON_KEY;
      try {
        const stored = localStorage.getItem("sb-bkugqqsjnrcrxgomjvda-auth-token") ||
                       localStorage.getItem("amritahub-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          token = parsed?.access_token || parsed?.currentSession?.access_token || token;
        }
      } catch {}

      const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
      const res = await fetch(`${url}/rest/v1/profiles?id=eq.${uid}`, {
        method: "GET",
        headers: {
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.length > 0) {
        const profileData = data[0];
        // Check if account is banned — sign out immediately if so
        if (profileData.banned === true) {
          setUser(null);
          setProfile({ banned: true, ban_reason: profileData.ban_reason || "" });
          try { await supabase.auth.signOut(); } catch {}
          try {
            localStorage.removeItem("sb-bkugqqsjnrcrxgomjvda-auth-token");
            localStorage.removeItem("amritahub-auth");
          } catch {}
          return;
        }
        setProfile(profileData);
      } else {
        // Create missing profile row for old accounts
        const createRes = await fetch(`${url}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${token}`,
            "Prefer": "return=representation"
          },
          body: JSON.stringify({ id: uid, name: "Student", department: "CSE" })
        });
        if (createRes.ok) {
          const newProfileData = await createRes.json();
          if (newProfileData && newProfileData[0]) {
            setProfile(newProfileData[0]);
            return;
          }
        }
        setProfile({ id: uid, name: "Student", department: "CSE" });
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
      setProfile({ id: uid, name: "Student", department: "CSE" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // onAuthStateChange fires immediately on load with current session,
    // and again when token is refreshed. This is the single source of truth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
            window.location.href = "/reset-password";
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Safety fallback: unblock UI after 3s in case of slow network
    const fallback = setTimeout(() => setLoading(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [fetchProfile]);

  async function register(name, email, password, year) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, year } },
    });
    if (error) throw error;
    
    // Log registration
    try { await supabase.from("login_logs").insert({ email }); } catch {}

    setProfile({ id: data.user.id, name, email, year, department: "CSE" });
    return data.user;
  }

  async function login(email, password) {
    const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWdxcXNqbnJjcnhnb21qdmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTMwMjYsImV4cCI6MjA5MzI2OTAyNn0.RRr0wnr6qCa2PdlqwezYWvx7eopldxP46-x6DCJypQU";

    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error_description || errData.error || "Invalid email or password");
    }

    const data = await res.json();
    if (data?.user && data?.access_token) {
      const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      const sessionObj = {
        ...data,
        expires_at: expiresAt,
      };

      try {
        localStorage.setItem("sb-bkugqqsjnrcrxgomjvda-auth-token", JSON.stringify(sessionObj));
        localStorage.setItem("amritahub-auth", JSON.stringify(sessionObj));
      } catch (e) {}

      // Sync the session with the Supabase SDK so onAuthStateChange fires correctly
      // This is what actually marks the user as logged in across the app
      try {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      } catch (e) {
        // If setSession fails (SDK bug), manually set user and fetch profile
        console.warn("setSession failed, falling back to manual state:", e);
        setUser(data.user);
        await fetchProfile(data.user.id);
      }

      // Log login activity
      try { await supabase.from("login_logs").insert({ email: data.user.email }); } catch {}
    }
  }

  async function logout() {
    setUser(null);
    setProfile(null);
    try { await supabase.auth.signOut(); } catch {}
  }

  async function updateProfile(updates) {
    if (!user) return;
    
    let token = process.env.REACT_APP_SUPABASE_ANON_KEY;
    try {
      const stored = localStorage.getItem("sb-bkugqqsjnrcrxgomjvda-auth-token") ||
                     localStorage.getItem("amritahub-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.access_token || parsed?.currentSession?.access_token || token;
      }
    } catch {}

    const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
    // Check if profile exists first to decide PUT (upsert) or POST
    // Supabase REST supports upsert via POST with Resolution header
    const res = await fetch(`${url}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`,
        "Prefer": "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify({ id: user.id, email: user.email, ...updates })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update profile: HTTP ${res.status}`);
    }

    const data = await res.json();
    const updated = data && data[0];
    if (updated) setProfile(updated);
    return updated;
  }

  async function resetPassword(email) {
    const url = window.location.origin + "/reset-password";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: url,
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, register, updateProfile, resetPassword, updatePassword }}>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#333" }}>
          <h2>Loading AmritaHub...</h2>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
