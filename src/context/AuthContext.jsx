// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) throw error;
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setLoading(false);
      }).catch(err => {
        console.error("Supabase getSession error:", err);
        setLoading(false);
      });
    } catch (err) {
      console.error("Supabase sync error:", err);
      setLoading(false);
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      setProfile(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function register(name, email, password, year) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, year }   // trigger reads these to create the profile row
      }
    });
    if (error) throw error;

    // Profile is created automatically by the DB trigger (handle_new_user)
    // Optimistically set profile so UI updates immediately
    setProfile({ id: data.user.id, name, email, year, department: "CSE" });
    return data.user;
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#333" }}>
          <h2>Loading AmritaHub...</h2>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
