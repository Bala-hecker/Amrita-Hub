// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout fallback to prevent infinite loading screens
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    let unsub = null;
    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setLoading(false);
      }).catch(err => {
        console.error("Supabase getSession error:", err);
        setLoading(false);
      });

      // Listen for auth state changes
      const res = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) await fetchProfile(newSession.user.id);
        else { setProfile(null); setLoading(false); }
      });
      if (res?.data?.subscription) unsub = res.data.subscription;
    } catch (err) {
      console.error("Auth initialization error:", err);
      setLoading(false);
    }

    return () => {
      clearTimeout(timer);
      if (unsub?.unsubscribe) unsub.unsubscribe();
    };
  }, []);

  async function fetchProfile(uid) {
    if (profile && profile.id === uid) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Automatically create missing profile row for old user accounts
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({ id: uid, name: user?.user_metadata?.name || "Student", department: "CSE" })
          .select()
          .single();
        if (newProfile) setProfile(newProfile);
      }
    } catch {
      setProfile({ id: uid, name: user?.user_metadata?.name || "Student", department: "CSE" });
    } finally {
      setLoading(false);
    }
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setSession(data.session);
      setUser(data.user);
      fetchProfile(data.user.id); // Trigger in the background
    }
  }

  async function logout() {
    setSession(null);
    setUser(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, register, login, logout }}>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#333" }}>
          <h2>Loading AmritaHub...</h2>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
