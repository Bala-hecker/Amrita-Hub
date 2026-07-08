// src/pages/Requests.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CheckCircle, HelpCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import { ALL_COURSES, getCourse } from "../data/curriculum";
import s from "./SimplePage.module.css";

export default function Requests() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState(() => {
    try {
      const cached = localStorage.getItem("amrita_requests_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(requests.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    courseCode: ALL_COURSES[0]?.code || "",
    description: "",
  });

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("resource_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      try {
        localStorage.setItem("amrita_requests_cache", JSON.stringify(data || []));
      } catch (e) {}
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    document.title = "Student Study Notes & Resource Requests | Amrita Hub - B.Tech CSE Portal";
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!form.title.trim()) {
      setError("Please enter what resource you need.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("resource_requests")
        .insert({
          title: form.title.trim(),
          course_code: form.courseCode,
          description: form.description.trim(),
          requested_by: user.id,
          requester_name: profile?.name || "Student",
        });

      if (error) throw error;

      setForm({
        title: "",
        courseCode: ALL_COURSES[0]?.code || "",
        description: "",
      });
      fetchRequests();
    } catch (err) {
      setError(err.message || "Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      const { error } = await supabase
        .from("resource_requests")
        .delete()
        .eq("id", reqId);

      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      alert("Error deleting request: " + err.message);
    }
  };

  const handleFulfill = (req) => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/", {
      state: {
        courseCode: req.course_code,
        fulfillTitle: `Fulfill: ${req.title}`,
      },
    });
  };

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.pageHeader}>
          <h1 className={s.heading}>🙋‍♂️ Resource Requests</h1>
          <p className={s.sub}>Can't find a resource? Ask your peers to upload it here.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px", marginTop: "20px" }}>
          {/* Submit form container */}
          <div>
            <div style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "var(--radius)", padding: "20px", position: "sticky", top: "calc(var(--nav-h) + 20px)" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "14px", fontWeight: 700 }}>Request a File</h3>
              {error && <div style={{ color: "#dc2626", background: "rgba(220,38,38,0.08)", padding: "10px", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "12px" }}>⚠️ {error}</div>}

              {user ? (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="field">
                    <label>Resource Needed *</label>
                    <input
                      value={form.title}
                      onChange={e => set("title", e.target.value)}
                      placeholder="e.g. 2024 Midsem Questions Paper"
                    />
                  </div>

                  <div className="field">
                    <label>Subject *</label>
                    <select
                      value={form.courseCode}
                      onChange={e => set("courseCode", e.target.value)}
                    >
                      {ALL_COURSES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} – {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Additional Notes (optional)</label>
                    <textarea
                      value={form.description}
                      onChange={e => set("description", e.target.value)}
                      placeholder="e.g. Any notes or specific topics will be highly appreciated!"
                      style={{ minHeight: "60px" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                    {submitting ? <Loader size={15} className="spin" /> : <><Plus size={15} /> Submit Request</>}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <p style={{ fontSize: "0.86rem", color: "var(--muted)", marginBottom: "12px" }}>You must be logged in to submit a request.</p>
                  <button onClick={() => navigate("/login")} className="btn btn-primary btn-sm btn-full">Log In</button>
                </div>
              )}
            </div>
          </div>

          {/* List container */}
          <div>
            {loading ? (
              <div className="loading-center" style={{ minHeight: "200px" }}><div className="spinner" /></div>
            ) : requests.length === 0 ? (
              <div className="empty-state" style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", padding: "40px" }}>
                <div className="icon">🙋‍♂️</div>
                <h3>No active requests</h3>
                <p>Everyone seems to have what they need! Or, be the first to request something.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {requests.map(req => {
                  const course = getCourse(req.course_code);
                  const isOwn = user?.id === req.requested_by;
                  return (
                    <div key={req.id} className="anim-fadeUp" style={{ background: "var(--white)", border: "1.5px solid var(--bdr)", borderRadius: "var(--radius)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div>
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", background: "var(--bg)", color: "var(--muted)", padding: "2px 8px", borderRadius: "8px", border: "1px solid var(--bdr)" }}>
                            {req.course_code}
                          </span>
                          {course && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: "8px" }}>{course.title}</span>}
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "6px", color: "var(--txt)" }}>{req.title}</h3>
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(req.id)}
                            style={{ color: "#dc2626", background: "none", border: "none", padding: "4px" }}
                            title="Delete Request"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {req.description && (
                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "pre-wrap" }}>{req.description}</p>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--bdr)", paddingTop: "10px", marginTop: "4px" }}>
                        <span style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                          Requested by <strong>{req.requester_name}</strong> · {new Date(req.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleFulfill(req)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: "4px", padding: "5px 12px" }}
                        >
                          <CheckCircle size={12} /> Fulfill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
