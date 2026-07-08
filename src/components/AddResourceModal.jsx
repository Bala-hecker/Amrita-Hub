import { useState, useRef, useMemo, useEffect } from "react";
import { X, Upload, Link as LinkIcon, Loader, CheckCircle } from "lucide-react";
import { useResources } from "../hooks/useResources";
import s from "./AddResourceModal.module.css";

const TYPES = ["Notes", "PDF", "Video", "Article", "Practice"];

const YEARS = [
  { id: "1", label: "1st Year (Semester 1 & 2)", sems: ["Semester I", "Semester II"], isElective: false },
  { id: "2", label: "2nd Year (Semester 3 & 4)", sems: ["Semester III", "Semester IV"], isElective: false },
  { id: "3", label: "3rd Year (Semester 5 & 6)", sems: ["Semester V", "Semester VI"], isElective: false },
  { id: "4", label: "4th Year (Semester 7 & 8)", sems: ["Semester VII", "Semester VIII"], isElective: false },
  { id: "E", label: "Professional & General Electives", sems: [], isElective: true },
];

export default function AddResourceModal({ onClose, onSubmit, prefillCourse, prefillTitle }) {
  const { allCourses: ALL_COURSES = [] } = useResources();

  const [form, setForm] = useState({
    title: prefillTitle || "",
    courseCode: prefillCourse || "",
    type: "Notes", link: "", description: "", tags: [],
  });

  const initialYear = useMemo(() => {
    if (prefillCourse) {
      const course = ALL_COURSES.find(c => c.code === prefillCourse);
      if (course) {
        if (course.isElective) return "E";
        if (["Semester I", "Semester II"].includes(course.semester)) return "1";
        if (["Semester III", "Semester IV"].includes(course.semester)) return "2";
        if (["Semester V", "Semester VI"].includes(course.semester)) return "3";
        if (["Semester VII", "Semester VIII"].includes(course.semester)) return "4";
      }
    }
    return "1"; // Default to 1st Year
  }, [prefillCourse, ALL_COURSES]);

  const [selectedYear, setSelectedYear] = useState(initialYear);

  const filteredCourses = useMemo(() => {
    const yearObj = YEARS.find(y => y.id === selectedYear);
    if (!yearObj) return [];
    if (yearObj.isElective) {
      return ALL_COURSES.filter(c => c.isElective);
    }
    return ALL_COURSES.filter(c => !c.isElective && yearObj.sems.includes(c.semester));
  }, [selectedYear, ALL_COURSES]);

  const getCourseLabel = (code) => {
    const course = ALL_COURSES.find(c => c.code === code);
    return course ? `${course.code} – ${course.title}` : "";
  };

  const [courseSearch, setCourseSearch] = useState(() => getCourseLabel(form.courseCode));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const q = courseSearch.toLowerCase().trim();
    const currentLabel = getCourseLabel(form.courseCode).toLowerCase();
    if (q === currentLabel || !q) return filteredCourses;

    return filteredCourses.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
    );
  }, [courseSearch, filteredCourses, form.courseCode]);

  const [file,     setFile]     = useState(null);
  const [useFile,  setUseFile]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (filteredCourses.length > 0) {
      const isCurrentCodeValid = filteredCourses.some(c => c.code === form.courseCode);
      if (!isCurrentCodeValid) {
        const nextCode = filteredCourses[0].code;
        set("courseCode", nextCode);
        setCourseSearch(getCourseLabel(nextCode));
      } else {
        setCourseSearch(getCourseLabel(form.courseCode));
      }
    }
  }, [selectedYear, filteredCourses]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim())                    return setError("Please enter a title.");
    if (!useFile && !form.link.trim())         return setError("Please paste a link or upload a file.");
    if (useFile  && !file)                     return setError("Please select a file to upload.");
    setError(""); setLoading(true); setProgress(0);
    try {
      const result = await onSubmit({ ...form, file: useFile ? file : null }, setProgress);
      if (result?.spamWarning) {
        setError("⚠️ Your resource was flagged for review and is pending admin approval. It won't appear publicly until reviewed.");
        setLoading(false);
        // Don't close — let user see the warning
        return;
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className={s.modal}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h2 className={s.title}>Share a Resource</h2>
            <p className={s.subtitle}>Help your peers study smarter</p>
          </div>
          <button className={s.closeBtn} onClick={onClose} disabled={loading}>
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {/* Title */}
          <div className="field">
            <label>Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. DBMS Normalization 1NF to BCNF" />
          </div>

          {/* Year */}
          <div className="field">
            <label>Academic Year / Category *</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {YEARS.map(y => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </div>

          {/* Course Search */}
          <div className="field" style={{ position: "relative" }}>
            <label>Course *</label>
            <input
              type="text"
              value={courseSearch}
              onChange={e => {
                setCourseSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type course code or title..."
            />
            {showSuggestions && (
              <ul style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "var(--white)",
                border: "1.5px solid var(--bdr)",
                borderRadius: "10px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 10,
                listStyle: "none",
                margin: 0,
                padding: "4px 0",
                boxShadow: "var(--sh-lg)"
              }}>
                {suggestions.length === 0 ? (
                  <li style={{ padding: "8px 12px", fontSize: "0.85rem", color: "var(--muted)" }}>
                    No matching courses found
                  </li>
                ) : (
                  suggestions.map(c => (
                    <li
                      key={c.code}
                      onClick={() => {
                        set("courseCode", c.code);
                        setCourseSearch(`${c.code} – ${c.title}`);
                        setShowSuggestions(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        fontSize: "0.85rem",
                        color: "var(--txt)",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(0,0,0,0.02)",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => e.target.style.background = "var(--bg)"}
                      onMouseLeave={e => e.target.style.background = "none"}
                    >
                      <strong>{c.code}</strong> – {c.title}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {/* Type pills */}
          <div className="field">
            <label>Resource Type *</label>
            <div className={s.typePicker}>
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`${s.typeBtn} ${form.type === t ? s.typeActive : ""}`}
                  onClick={() => set("type", t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Link / File toggle */}
          <div className={s.sourceToggle}>
            <button type="button"
              className={`${s.toggleBtn} ${!useFile ? s.toggleActive : ""}`}
              onClick={() => setUseFile(false)}>
              <LinkIcon size={14} /> Paste a Link
            </button>
            <button type="button"
              className={`${s.toggleBtn} ${useFile ? s.toggleActive : ""}`}
              onClick={() => setUseFile(true)}>
              <Upload size={14} /> Upload File
            </button>
          </div>

          {useFile ? (
            <div className={`${s.dropZone} ${file ? s.dropZoneHasFile : ""}`}
              onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" hidden
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.png,.jpg"
                onChange={e => { 
                  const f = e.target.files[0];
                  if (f && f.size > 20 * 1024 * 1024) {
                    setError("File must be smaller than 20MB.");
                    setFile(null);
                  } else {
                    setFile(f); 
                    setError(""); 
                  }
                }} />
              {file ? (
                <><CheckCircle size={22} className={s.dropIconOk} />
                  <span className={s.dropFileName}>{file.name}</span>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></>
              ) : (
                <><Upload size={22} className={s.dropIcon} />
                  <span>Tap to choose file</span>
                  <small>PDF, DOCX, PPT, ZIP — max 20MB</small></>
              )}
            </div>
          ) : (
            <div className="field">
              <label>Resource Link</label>
              <input type="url" value={form.link} onChange={e => set("link", e.target.value)}
                placeholder="https://drive.google.com/… or YouTube link" />
            </div>
          )}

          {/* Tags */}
          <div className="field">
            <label>Tags / Exam Relevance (optional)</label>
            <div className={s.tagPicker} style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {["Mid-Sem", "End-Sem", "PYQ", "Cheat Sheet", "Lab"].map(tag => {
                const selected = form.tags?.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      border: "1.5px solid var(--bdr)",
                      background: selected ? "var(--cr-l)" : "var(--white)",
                      color: selected ? "var(--cr)" : "var(--txt)",
                      borderColor: selected ? "var(--cr)" : "var(--bdr)",
                      transition: "all 0.15s",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      const currentTags = form.tags || [];
                      const nextTags = currentTags.includes(tag)
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag];
                      set("tags", nextTags);
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}

              {/* Custom tags added by user */}
              {(form.tags || []).filter(tag => !["Mid-Sem", "End-Sem", "PYQ", "Cheat Sheet", "Lab"].includes(tag)).map(tag => (
                <button
                  key={tag}
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "1.5px solid var(--cr)",
                    background: "var(--cr-l)",
                    color: "var(--cr)",
                    transition: "all 0.15s",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onClick={() => {
                    set("tags", form.tags.filter(t => t !== tag));
                  }}
                >
                  #{tag} <span style={{ fontWeight: 800 }}>×</span>
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                type="text"
                placeholder="Or type custom tag..."
                id="customTagInput"
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  border: "1.5px solid var(--bdr)",
                  background: "var(--white)",
                  color: "var(--txt)",
                  outline: "none",
                  flex: 1
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = e.target.value.trim().replace(/#/g, "");
                    if (val && !form.tags?.includes(val)) {
                      set("tags", [...(form.tags || []), val]);
                      e.target.value = "";
                    }
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const input = document.getElementById("customTagInput");
                  const val = input?.value.trim().replace(/#/g, "");
                  if (val && !form.tags?.includes(val)) {
                    set("tags", [...(form.tags || []), val]);
                    input.value = "";
                  }
                }}
                style={{ borderRadius: "20px" }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label>Description (optional)</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="What does this resource cover? Who is it useful for?" />
          </div>

          {/* Upload progress */}
          {loading && file && (
            <div className={s.progressWrap}>
              <div className={s.progressBar} style={{ width: `${progress}%` }} />
              <span className={s.progressLabel}>{progress}%</span>
            </div>
          )}

          {error && <div className={s.error}>{error}</div>}

          <button type="submit" className={`btn btn-primary btn-full ${s.submitBtn}`} disabled={loading}>
            {loading
              ? <><Loader size={16} className={s.spin} /> {file ? "Uploading…" : "Sharing…"}</>
              : "Share Resource 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
