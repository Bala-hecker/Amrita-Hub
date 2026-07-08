// src/pages/Profile.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useResources } from "../hooks/useResources";
import ResourceCard from "../components/ResourceCard";
import { supabase } from "../supabase";
import s from "./Profile.module.css";
import { User, Upload, Star, Bookmark, Shield, Edit2, Check, X, RefreshCw, Trash2, CheckSquare } from "lucide-react";

const ADMIN_EMAIL = "balamuruganprabakar@gmail.com";

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const { resources, toggleVote, toggleSave, deleteResource, semesters, electives, allCourses, fetchCourses, coursesLoading, staticAllList } = useResources();

  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    department: "CSE",
    year: "1st Year",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  // Admin Panel State
  const [adminStats, setAdminStats] = useState({
    totalLogins: 0,
    totalResources: 0,
    totalRequests: 0,
    totalUsers: 0,
  });
  const [loginLogs, setLoginLogs] = useState([]);
  const [flaggedResources, setFlaggedResources] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [studentSearchQ, setStudentSearchQ] = useState("");
  const [adminSubTab, setAdminSubTab] = useState("overview"); // "overview", "students", "courses"
  const [adminLoading, setAdminLoading] = useState(false);

  // Courses Editor State
  const [courseForm, setCourseForm] = useState({
    code: "",
    title: "",
    credits: 3,
    cat: "CSE",
    semester: "Semester I"
  });
  const [courseEditMode, setCourseEditMode] = useState(false); // false = Add, true = Edit
  const [courseSearchQ, setCourseSearchQ] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Initialize edit form
  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        department: profile.department || "CSE",
        year: profile.year || "1st Year",
      });
    }
  }, [profile]);

  // Load Admin Stats if tab is selected
  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
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
      const headers = {
        "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`
      };

      const fetchCount = async (path) => {
        const res = await fetch(`${url}/rest/v1/${path}?select=id`, {
          method: "GET",
          headers: { ...headers, "Prefer": "count=exact" }
        });
        if (!res.ok) return 0;
        const range = res.headers.get("Content-Range");
        if (range) {
          const count = range.split("/")[1];
          return parseInt(count) || 0;
        }
        const data = await res.json();
        return data?.length || 0;
      };

      const fetchJson = async (path) => {
        const res = await fetch(`${url}/rest/v1/${path}`, {
          method: "GET",
          headers
        });
        if (!res.ok) return [];
        return await res.json();
      };

      const [loginsCount, logs, resCount, reqCount, registeredUsersData, allRes] = await Promise.all([
        fetchCount("login_logs"),
        fetchJson("login_logs?select=*&order=logged_in_at.desc&limit=30"),
        fetchCount("resources"),
        fetchCount("resource_requests"),
        fetchJson("profiles?select=*&order=name.asc"),
        fetchJson("resources?select=*&order=created_at.desc")
      ]);

      const reported = (allRes || []).filter(
        r => Array.isArray(r.reports) && r.reports.length > 0
      );

      setAdminStats({
        totalLogins: loginsCount,
        totalResources: resCount,
        totalRequests: reqCount,
        totalUsers: registeredUsersData?.length || 0,
      });
      setLoginLogs(logs || []);
      setFlaggedResources(reported);
      setRegisteredUsers(registeredUsersData || []);
    } catch (err) {
      console.error("Error loading admin console details:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && isAdmin) {
      fetchAdminData();
    }
  }, [activeTab]);

  const filteredStudents = useMemo(() => {
    const q = studentSearchQ.toLowerCase().trim();
    if (!q) return registeredUsers;
    return registeredUsers.filter(s =>
      (s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q) ||
      (s.year || "").toLowerCase().includes(q)
    );
  }, [studentSearchQ, registeredUsers]);

  if (!user) return null;

  const userUploads = resources.filter((r) => r.uploaded_by === user.id);
  const totalUpvotesReceived = userUploads.reduce((acc, curr) => acc + (curr.votes || 0), 0);
  const totalSaved = resources.filter(
    (r) => Array.isArray(r.saved_by) && r.saved_by.includes(user.id)
  ).length;

  const initials = (profile?.name || user.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setSaveError("Name cannot be empty.");
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      await updateProfile({
        name: editForm.name.trim(),
        department: editForm.department,
        year: editForm.year,
      });
      setSaveSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeepResource = async (resId) => {
    try {
      const resource = flaggedResources.find(r => r.id === resId);
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
      const res = await fetch(`${url}/rest/v1/resources?id=eq.${resId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reports: [] })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setFlaggedResources(prev => prev.filter(r => r.id !== resId));

      // Trigger email notification to the uploader that their resource is approved
      if (resource) {
        const uploader = registeredUsers.find(u => u.id === resource.uploaded_by);
        if (uploader?.email) {
          sendAdminEmail(uploader.email, "approved", uploader.name, resource.title);
        }
      }
    } catch (err) {
      alert("Failed to keep resource: " + err.message);
    }
  };

  const handleAdminDelete = async (resId) => {
    if (!window.confirm("Are you sure you want to permanently delete this reported resource?")) return;
    try {
      await deleteResource(resId);
      setFlaggedResources(prev => prev.filter(r => r.id !== resId));
    } catch (err) {
      alert("Failed to delete resource: " + err.message);
    }
  };

  const getToken = () => {
    let token = process.env.REACT_APP_SUPABASE_ANON_KEY;
    try {
      const stored = localStorage.getItem("sb-bkugqqsjnrcrxgomjvda-auth-token") ||
                     localStorage.getItem("amritahub-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.access_token || parsed?.currentSession?.access_token || token;
      }
    } catch {}
    return token;
  };

  const sendAdminEmail = async (to, type, userName, extra) => {
    if (!to) return;
    try {
      const token = getToken();
      const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
      await fetch(`${url}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ to, type, userName, extra })
      });
    } catch (err) {
      console.warn("Failed to send admin email notice:", err);
    }
  };

  const handleBanUser = async (userId, banReason) => {
    const reason = banReason || window.prompt("Enter ban reason (optional):", "Policy violation");
    if (reason === null) return; // cancelled
    const token = getToken();
    const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ banned: true, ban_reason: reason || "Policy violation" })
    });
    if (!res.ok) { alert("Failed to ban user."); return; }
    
    // Notify student via email about the ban
    const student = registeredUsers.find(u => u.id === userId);
    if (student?.email) {
      sendAdminEmail(student.email, "ban", student.name, reason);
    }

    setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true, ban_reason: reason } : u));
    alert("User banned successfully.");
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm("Unban this user? They will be able to log in again.")) return;
    const token = getToken();
    const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
    const res = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ banned: false, ban_reason: null })
    });
    if (!res.ok) { alert("Failed to unban user."); return; }

    // Notify student via email that unban is successful
    const student = registeredUsers.find(u => u.id === userId);
    if (student?.email) {
      sendAdminEmail(student.email, "unban", student.name);
    }

    setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false, ban_reason: null } : u));
    alert("User unbanned successfully.");
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ Permanently delete account "${userName || "this user"}" and all their resources? This FULLY removes their login access and cannot be undone.`)) return;
    const token = getToken();
    const url = process.env.REACT_APP_SUPABASE_URL || "https://bkugqqsjnrcrxgomjvda.supabase.co";
    
    const student = registeredUsers.find(u => u.id === userId);
    const studentEmail = student?.email;
    const studentName = student?.name;

    try {
      // Step 1: Delete their uploaded resources
      await fetch(`${url}/rest/v1/resources?uploaded_by=eq.${userId}`, {
        method: "DELETE",
        headers: { "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` }
      });

      // Step 2: Delete their profile row
      const profileRes = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
        method: "DELETE",
        headers: { "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` }
      });
      if (!profileRes.ok) { alert("Failed to delete user profile."); return; }

      // Step 3: Call the Edge Function to delete the auth user (full login removal)
      const edgeRes = await fetch(`${url}/functions/v1/delete-auth-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ userId })
      });

      if (!edgeRes.ok) {
        const edgeErr = await edgeRes.json().catch(() => ({}));
        // Edge function may not be deployed yet — still update UI
        console.warn("Edge function error (auth user not deleted):", edgeErr.error);
        setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
        
        if (studentEmail) {
          sendAdminEmail(studentEmail, "delete", studentName);
        }

        alert(`Profile & resources deleted ✅\n\n⚠️ Auth account could not be removed automatically: ${edgeErr.error || "Edge function not deployed yet"}.\n\nTo finish: Supabase Dashboard → Authentication → Users → Delete manually.`);
        return;
      }

      // All 3 steps succeeded — full deletion complete
      setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      
      if (studentEmail) {
        sendAdminEmail(studentEmail, "delete", studentName);
      }

      alert(`✅ "${userName || "User"}" fully deleted:\n• Resources deleted\n• Profile deleted\n• Login access revoked`);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Analytics: compute daily login + upload counts for last 7 days
  const analyticsData = useMemo(() => {
    const days = 7;
    const today = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD

      const logins = loginLogs.filter(l => {
        const logDate = (l.logged_in_at || l.created_at || "").slice(0, 10);
        return logDate === dateStr;
      }).length;

      const uploads = resources.filter(r => {
        const upDate = (r.created_at || "").slice(0, 10);
        return upDate === dateStr;
      }).length;

      result.push({ label, logins, uploads });
    }
    return result;
  }, [loginLogs, resources]);

  const handleSeedCourses = async () => {
    if (!window.confirm("Are you sure you want to seed all default curriculum courses? This will populate the Supabase DB.")) return;
    setAdminLoading(true);
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
      const res = await fetch(`${url}/rest/v1/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(staticAllList.map(c => ({
          code: c.code,
          title: c.title,
          credits: parseInt(c.credits) || 3,
          cat: c.cat || "CSE",
          semester: c.semester
        })))
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Seed failed: HTTP ${res.status}`);
      }

      alert("Successfully seeded default Amrita courses!");
      await fetchCourses();
    } catch (err) {
      alert("Failed to seed courses: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.code.trim()) return alert("Course Code is required.");
    if (!courseForm.title.trim()) return alert("Course Title is required.");
    
    setAdminLoading(true);
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
      const res = await fetch(`${url}/rest/v1/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify({
          code: courseForm.code.trim().toUpperCase(),
          title: courseForm.title.trim(),
          credits: parseInt(courseForm.credits) || 3,
          cat: courseForm.cat,
          semester: courseForm.semester.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to save course: HTTP ${res.status}`);
      }

      setCourseForm({ code: "", title: "", credits: 3, cat: "CSE", semester: "Semester I" });
      setCourseEditMode(false);
      await fetchCourses();
      alert("Course saved successfully!");
    } catch (err) {
      alert("Failed to save course: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteCourse = async (code) => {
    if (!window.confirm(`Are you sure you want to permanently delete course ${code}?`)) return;
    setAdminLoading(true);
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
      const res = await fetch(`${url}/rest/v1/courses?code=eq.${code}`, {
        method: "DELETE",
        headers: {
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to delete course: HTTP ${res.status}`);
      }

      await fetchCourses();
      alert("Course deleted successfully!");
    } catch (err) {
      alert("Failed to delete course: " + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const filteredCoursesList = useMemo(() => {
    const q = courseSearchQ.toLowerCase().trim();
    if (!q) return allCourses;
    return allCourses.filter(c =>
      (c.code || "").toLowerCase().includes(q) ||
      (c.title || "").toLowerCase().includes(q) ||
      (c.semester || "").toLowerCase().includes(q)
    );
  }, [courseSearchQ, allCourses]);
  return (
    <div className="page-container anim-fadeUp" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: 900, color: "var(--txt)", letterSpacing: "-0.03em" }}>Account Profile</h1>
        <p className="page-subtitle" style={{ color: "var(--muted)", fontSize: "1rem" }}>View your personal upload statistics and manage your study resources</p>
      </div>

      {/* Tabs */}
      <div className={s.tabsBar}>
        <button
          className={`${s.tabBtn} ${activeTab === "profile" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={16} /> Profile Details
        </button>
        <button
          className={`${s.tabBtn} ${activeTab === "uploads" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("uploads")}
        >
          <Upload size={16} /> Your Uploads
        </button>
        {isAdmin && (
          <button
            className={`${s.tabBtn} ${activeTab === "admin" ? s.tabActive : ""}`}
            onClick={() => setActiveTab("admin")}
            style={{ color: "var(--cr)", fontWeight: 700 }}
          >
            <Shield size={16} /> Admin Console
          </button>
        )}
      </div>

      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header Card */}
          <div className={s.profileHeader}>
            <div className={s.avatarLarge}>{initials}</div>
            <div className={s.userInfo}>
              <h2 className={s.userName}>{profile?.name || user.displayName || "Student"}</h2>
              <p className={s.userEmail}>{profile?.email || user.email}</p>
              <div className={s.userMeta}>
                <span className={s.department}>{profile?.department || "CSE"}</span>
                <span className={s.year}>{profile?.year || "1st Year"}</span>
              </div>
            </div>
            {!isEditing && (
              <button className={s.editBtn} onClick={() => setIsEditing(true)}>
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
          </div>

          {/* Inline Edit Form */}
          {isEditing && (
            <form onSubmit={handleProfileSave} className={s.editCard}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Customize Profile Details</h3>
              {saveError && <div className={s.errorMessage}>⚠️ {saveError}</div>}
              {saveSuccess && <div className={s.successMessage}>✓ {saveSuccess}</div>}
              
              <div className={s.formGrid}>
                <div className="field">
                  <label>Full Name</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="field">
                  <label>Department</label>
                  <select
                    value={editForm.department}
                    onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                  >
                    <option value="CSE">CSE – Computer Science & Engineering</option>
                    <option value="AI">AIE – Artificial Intelligence & Data Science</option>
                    <option value="ECE">ECE – Electronics & Communication</option>
                    <option value="EEE">EEE – Electrical & Electronics</option>
                  </select>
                </div>
                <div className="field">
                  <label>Academic Year</label>
                  <select
                    value={editForm.year}
                    onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}
                  >
                    <option value="1st Year">1st Year (Semester 1 & 2)</option>
                    <option value="2nd Year">2nd Year (Semester 3 & 4)</option>
                    <option value="3rd Year">3rd Year (Semester 5 & 6)</option>
                    <option value="4th Year">4th Year (Semester 7 & 8)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Check size={15} /> Save Changes
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}

          {/* Stats Grid */}
          <div className={s.statsGrid}>
            <div className={s.statCard}>
              <div className={s.statIconWrapper}><Upload size={22} /></div>
              <div className={s.statInfo}>
                <span className={s.statValue}>{userUploads.length}</span>
                <span className={s.statLabel}>Uploads</span>
              </div>
            </div>
            <div className={s.statCard}>
              <div className={s.statIconWrapper}><Star size={22} /></div>
              <div className={s.statInfo}>
                <span className={s.statValue}>{totalUpvotesReceived}</span>
                <span className={s.statLabel}>Upvotes Received</span>
              </div>
            </div>
            <div className={s.statCard}>
              <div className={s.statIconWrapper}><Bookmark size={22} /></div>
              <div className={s.statInfo}>
                <span className={s.statValue}>{totalSaved}</span>
                <span className={s.statLabel}>Saved Items</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "uploads" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 className={s.sectionTitle}><Upload size={18} /> Your Uploaded Resources</h3>
          {userUploads.length === 0 ? (
            <div className={s.emptyState}>
              <Upload size={42} className={s.emptyIcon} />
              <p className={s.emptyText}>You haven&#39;t shared any resources yet.</p>
            </div>
          ) : (
            <div className={s.grid}>
              {userUploads.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onVote={() => toggleVote(resource.id)}
                  onSave={() => toggleSave(resource.id)}
                  onDelete={deleteResource}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "admin" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className={s.sectionTitle} style={{ color: "var(--cr)" }}><Shield size={20} /> System Metrics & Administration</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchAdminData} disabled={adminLoading}>
              <RefreshCw size={14} className={adminLoading ? s.spin : ""} /> Refresh Data
            </button>
          </div>

          {/* Sub Tab Navigation */}
          <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--bdr)", paddingBottom: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{
                background: adminSubTab === "overview" ? "var(--cr-l)" : "transparent",
                color: adminSubTab === "overview" ? "var(--cr)" : "var(--muted)",
                borderColor: adminSubTab === "overview" ? "var(--cr)" : "transparent",
                fontWeight: 700
              }}
              onClick={() => setAdminSubTab("overview")}
            >
              ⚡ Overview & Moderation
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{
                background: adminSubTab === "students" ? "var(--cr-l)" : "transparent",
                color: adminSubTab === "students" ? "var(--cr)" : "var(--muted)",
                borderColor: adminSubTab === "students" ? "var(--cr)" : "transparent",
                fontWeight: 700
              }}
              onClick={() => setAdminSubTab("students")}
            >
              👥 Registered Students ({registeredUsers.length})
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{
                background: adminSubTab === "courses" ? "var(--cr-l)" : "transparent",
                color: adminSubTab === "courses" ? "var(--cr)" : "var(--muted)",
                borderColor: adminSubTab === "courses" ? "var(--cr)" : "transparent",
                fontWeight: 700
              }}
              onClick={() => setAdminSubTab("courses")}
            >
              📚 Manage Courses ({allCourses.length})
            </button>
          </div>

          {adminLoading ? (
            <div className="loading-center" style={{ minHeight: "200px" }}><div className="spinner" /></div>
          ) : (
            <>
              {adminSubTab === "overview" && (
                <>
                  {/* Admin Metrics Grid */}
                  <div className={s.adminStatsGrid}>
                    <div className={s.adminStatCard}>
                      <h4>Total User Logins</h4>
                      <span className={s.adminStatVal}>{adminStats.totalLogins}</span>
                    </div>
                    <div className={s.adminStatCard}>
                      <h4>Resources Shared</h4>
                      <span className={s.adminStatVal}>{adminStats.totalResources}</span>
                    </div>
                    <div className={s.adminStatCard}>
                      <h4>Active Request Threads</h4>
                      <span className={s.adminStatVal}>{adminStats.totalRequests}</span>
                    </div>
                    <div className={s.adminStatCard}>
                      <h4>Registered Students</h4>
                      <span className={s.adminStatVal}>{adminStats.totalUsers}</span>
                    </div>
                  </div>

                  {/* 📈 Analytics Chart - Last 7 Days */}
                  {analyticsData.length > 0 && (() => {
                    const maxVal = Math.max(...analyticsData.map(d => Math.max(d.logins, d.uploads)), 1);
                    const chartH = 120;
                    const barW = 24;
                    const barGap = 16;
                    const groupW = barW * 2 + barGap;
                    const totalW = analyticsData.length * (groupW + 20);
                    return (
                      <div style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "14px", padding: "20px 24px", boxShadow: "var(--sh)", marginTop: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                          <h4 style={{ fontWeight: 800, fontSize: "1rem" }}>📈 Activity — Last 7 Days</h4>
                          <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "var(--muted)" }}>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--cr)", marginRight: 5 }}/>Logins</span>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#3b82f6", marginRight: 5 }}/>Uploads</span>
                          </div>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <svg width={totalW} height={chartH + 32} style={{ display: "block" }}>
                            {analyticsData.map((d, i) => {
                              const x = i * (groupW + 20) + 10;
                              const loginH = Math.round((d.logins / maxVal) * chartH);
                              const uploadH = Math.round((d.uploads / maxVal) * chartH);
                              return (
                                <g key={d.label}>
                                  {/* Login bar */}
                                  <rect x={x} y={chartH - loginH} width={barW} height={loginH} rx={4} fill="var(--cr)" opacity={0.85}/>
                                  {loginH > 0 && <text x={x + barW / 2} y={chartH - loginH - 4} textAnchor="middle" fontSize="9" fill="var(--muted)">{d.logins}</text>}
                                  {/* Upload bar */}
                                  <rect x={x + barW + barGap} y={chartH - uploadH} width={barW} height={uploadH} rx={4} fill="#3b82f6" opacity={0.8}/>
                                  {uploadH > 0 && <text x={x + barW + barGap + barW / 2} y={chartH - uploadH - 4} textAnchor="middle" fontSize="9" fill="var(--muted)">{d.uploads}</text>}
                                  {/* Date label */}
                                  <text x={x + groupW / 2} y={chartH + 18} textAnchor="middle" fontSize="9" fill="var(--muted)">{d.label}</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Layout splits into Moderation and Logs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
                    {/* Flagged and Reported Resources */}
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>⚠️ Moderation: Reported Resources</h4>
                      {flaggedResources.length === 0 ? (
                        <div className={s.adminSuccessState}>
                          <CheckSquare size={32} />
                          <p>All clean! No reported files pending review.</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {flaggedResources.map(res => (
                            <div key={res.id} style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div>
                                <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", background: "var(--cr-l)", color: "var(--cr)", padding: "2px 8px", borderRadius: "8px", border: "1px solid var(--cr)" }}>
                                  ⚠️ Flagged Count: {res.reports?.length || 0}
                                </span>
                                <h5 style={{ fontSize: "0.92rem", fontWeight: 700, marginTop: "6px" }}>{res.title}</h5>
                                <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Subject: {res.course_code} · Shared by {res.uploader_name}</span>
                              </div>
                              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--bdr)", paddingTop: "8px", marginTop: "4px" }}>
                                <button onClick={() => handleKeepResource(res.id)} className="btn btn-secondary btn-sm" style={{ padding: "4px 10px", gap: "4px" }}>
                                  <Check size={12} /> Dismiss Flag
                                </button>
                                <button onClick={() => handleAdminDelete(res.id)} className="btn btn-primary btn-sm" style={{ padding: "4px 10px", gap: "4px", background: "var(--cr)" }}>
                                  <Trash2 size={12} /> Delete File
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Login logs */}
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>⏱️ Access Logs (Last 30 Logins)</h4>
                      <div style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "var(--radius)", padding: "14px", maxHeight: "400px", overflowY: "auto" }}>
                        {loginLogs.length === 0 ? (
                          <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center" }}>No logs recorded yet.</p>
                        ) : (
                          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid var(--bdr)" }}>
                                <th style={{ padding: "6px 8px", fontSize: "0.74rem", color: "var(--muted)", textTransform: "uppercase" }}>User Email</th>
                                <th style={{ padding: "6px 8px", fontSize: "0.74rem", color: "var(--muted)", textTransform: "uppercase" }}>Time (UTC)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loginLogs.map(log => (
                                <tr key={log.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                                  <td style={{ padding: "8px", fontSize: "0.8rem", fontWeight: 600, color: "var(--txt)" }}>{log.email}</td>
                                  <td style={{ padding: "8px", fontSize: "0.76rem", color: "var(--muted)" }}>
                                    {new Date(log.logged_in_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {adminSubTab === "students" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800 }}>👥 Registered Student Directory</h4>
                    <input
                      type="text"
                      placeholder="🔍 Search student name, email, year..."
                      value={studentSearchQ}
                      onChange={e => setStudentSearchQ(e.target.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid var(--bdr)",
                        background: "var(--white)",
                        color: "var(--txt)",
                        width: "100%",
                        maxWidth: "350px",
                        fontSize: "0.88rem"
                      }}
                    />
                  </div>

                  <div style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--sh)" }}>
                    {filteredStudents.length === 0 ? (
                      <p style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "0.9rem" }}>No students match your search query.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1.5px solid var(--bdr)" }}>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Student Name</th>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Email Address</th>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Department</th>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Year</th>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Status</th>
                              <th style={{ padding: "12px 16px", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map(student => (
                              <tr key={student.id} style={{ borderBottom: "1px solid var(--bdr)", background: student.banned ? "rgba(192,0,60,0.04)" : "transparent" }}>
                                <td style={{ padding: "12px 16px", fontSize: "0.88rem", fontWeight: 700, color: "var(--txt)" }}>{student.name || "Student"}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.82rem", color: "var(--txt)" }}>{student.email || "No Email"}</td>
                                <td style={{ padding: "12px 16px", fontSize: "0.82rem" }}>
                                  <span className={s.department} style={{ padding: "2px 8px", fontSize: "0.7rem", display: "inline-block" }}>{student.department || "CSE"}</span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: "0.82rem" }}>
                                  <span className={s.year} style={{ padding: "2px 8px", fontSize: "0.7rem", display: "inline-block" }}>{student.year || "Unknown"}</span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  {student.banned
                                    ? <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700 }}>🚫 Banned</span>
                                    : <span style={{ background: "#d1fae5", color: "#059669", padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700 }}>✅ Active</span>
                                  }
                                </td>
                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                  {student.email !== user?.email && (
                                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                      {student.banned ? (
                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "#059669", borderColor: "#059669" }}
                                          onClick={() => handleUnbanUser(student.id)}>
                                          ✅ Unban
                                        </button>
                                      ) : (
                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "#d97706", borderColor: "#d97706" }}
                                          onClick={() => handleBanUser(student.id)}>
                                          🚫 Ban
                                        </button>
                                      )}
                                      <button className="btn btn-primary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px", background: "#dc2626", border: "none" }}
                                        onClick={() => handleDeleteUser(student.id, student.name)}>
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminSubTab === "courses" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px" }}>
                  {/* Left Column: Course Directory */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 800 }}>📚 Active Course Directory</h4>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: "var(--cr)", color: "var(--cr)", fontSize: "0.8rem", fontWeight: 700 }}
                          onClick={handleSeedCourses}
                        >
                          ⚡ Seed Default Syllabus
                        </button>
                        <input
                          type="text"
                          placeholder="Search courses..."
                          value={courseSearchQ}
                          onChange={e => setCourseSearchQ(e.target.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1.5px solid var(--bdr)",
                            background: "var(--white)",
                            color: "var(--txt)",
                            fontSize: "0.82rem",
                            width: "180px"
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--sh)", maxHeight: "550px", overflowY: "auto" }}>
                      {filteredCoursesList.length === 0 ? (
                        <p style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>No courses match your query.</p>
                      ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1.5px solid var(--bdr)", position: "sticky", top: 0, zIndex: 1 }}>
                              <th style={{ padding: "10px 14px", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Code</th>
                              <th style={{ padding: "10px 14px", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Title</th>
                              <th style={{ padding: "10px 14px", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Cr</th>
                              <th style={{ padding: "10px 14px", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" }}>Sem/Track</th>
                              <th style={{ padding: "10px 14px", fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCoursesList.map(c => (
                              <tr key={c.code} style={{ borderBottom: "1px solid var(--bdr)" }}>
                                <td style={{ padding: "10px 14px", fontSize: "0.82rem", fontWeight: 700, color: "var(--txt)" }}>{c.code}</td>
                                <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--txt)", fontWeight: 500 }} title={c.title}>{c.title}</td>
                                <td style={{ padding: "10px 14px", fontSize: "0.82rem", color: "var(--txt)" }}>{c.credits}</td>
                                <td style={{ padding: "10px 14px", fontSize: "0.76rem", color: "var(--muted)" }}>{c.semester}</td>
                                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                                      onClick={() => {
                                        setCourseForm({
                                          code: c.code,
                                          title: c.title,
                                          credits: c.credits || 3,
                                          cat: c.cat || "CSE",
                                          semester: c.semester || "Semester I"
                                        });
                                        setCourseEditMode(true);
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: "2px 6px", fontSize: "0.75rem", background: "var(--cr)" }}
                                      onClick={() => handleDeleteCourse(c.code)}
                                    >
                                      Del
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Add/Edit Form */}
                  <div>
                    <form onSubmit={handleSaveCourse} className={s.editCard} style={{ margin: 0, position: "sticky", top: "20px" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "16px", color: "var(--cr)" }}>
                        {courseEditMode ? "📝 Edit Course Details" : "➕ Add New Course"}
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "4px" }}>Course Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 23CSE202"
                            value={courseForm.code}
                            onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))}
                            disabled={courseEditMode}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--bdr)", width: "100%", background: "var(--white)", color: "var(--txt)" }}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "4px" }}>Course Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Database Management Systems"
                            value={courseForm.title}
                            onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--bdr)", width: "100%", background: "var(--white)", color: "var(--txt)" }}
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div className="field">
                            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "4px" }}>Credits</label>
                            <input
                              type="number"
                              min="1"
                              max="6"
                              value={courseForm.credits}
                              onChange={e => setCourseForm(f => ({ ...f, credits: parseInt(e.target.value) || 3 }))}
                              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--bdr)", width: "100%", background: "var(--white)", color: "var(--txt)" }}
                            />
                          </div>
                          <div className="field">
                            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "4px" }}>Category</label>
                            <select
                              value={courseForm.cat}
                              onChange={e => setCourseForm(f => ({ ...f, cat: e.target.value }))}
                              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--bdr)", width: "100%", background: "var(--white)", color: "var(--txt)" }}
                            >
                              <option value="CSE">CSE (Core Computer Science)</option>
                              <option value="SCI">SCI (Sciences & Math)</option>
                              <option value="ENGG">ENGG (Engineering Science)</option>
                              <option value="HUM">HUM (Humanities)</option>
                              <option value="PRJ">PRJ (Projects/Internships)</option>
                            </select>
                          </div>
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "4px" }}>Semester / Elective Track</label>
                          <input
                            type="text"
                            placeholder="e.g. Semester III or Cyber Security"
                            list="semester-options"
                            value={courseForm.semester}
                            onChange={e => setCourseForm(f => ({ ...f, semester: e.target.value }))}
                            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--bdr)", width: "100%", background: "var(--white)", color: "var(--txt)" }}
                          />
                          <datalist id="semester-options">
                            <option value="Semester I" />
                            <option value="Semester II" />
                            <option value="Semester III" />
                            <option value="Semester IV" />
                            <option value="Semester V" />
                            <option value="Semester VI" />
                            <option value="Semester VII" />
                            <option value="Semester VIII" />
                            <option value="Cyber Security" />
                            <option value="Computer Networks" />
                            <option value="Data Science" />
                            <option value="Cyber Physical Systems" />
                            <option value="Computer Vision" />
                            <option value="Artificial Intelligence" />
                            <option value="General Electives" />
                          </datalist>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                          <Check size={14} /> Save Course
                        </button>
                        {courseEditMode && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setCourseForm({ code: "", title: "", credits: 3, cat: "CSE", semester: "Semester I" });
                              setCourseEditMode(false);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
