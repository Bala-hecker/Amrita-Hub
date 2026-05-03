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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Create missing profile row for old accounts
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ id: uid, name: "Student", department: "CSE" })
          .select()
          .single();
        if (newProfile) setProfile(newProfile);
        else setProfile({ id: uid, name: "Student", department: "CSE" });
      }
    } catch {
      setProfile({ id: uid, name: "Student", department: "CSE" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // onAuthStateChange fires immediately on load with current session,
    // and again when token is refreshed. This is the single source of truth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
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
    setProfile({ id: data.user.id, name, email, year, department: "CSE" });
    return data.user;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
  }

  async function logout() {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut().catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, register }}>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#333" }}>
          <h2>Loading AmritaHub...</h2>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
