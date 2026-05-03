// src/components/AddResourceModal.jsx
import { useState, useRef } from "react";
import { X, Upload, Link as LinkIcon, Loader, CheckCircle } from "lucide-react";
import { ALL_COURSES } from "../data/curriculum";
import s from "./AddResourceModal.module.css";

const TYPES = ["Notes", "PDF", "Video", "Article", "Practice"];

export default function AddResourceModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: "", courseCode: ALL_COURSES[0]?.code || "",
    type: "Notes", link: "", description: "",
  });
  const [file,     setFile]     = useState(null);
  const [useFile,  setUseFile]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim())                    return setError("Please enter a title.");
    if (!useFile && !form.link.trim())         return setError("Please paste a link or upload a file.");
    if (useFile  && !file)                     return setError("Please select a file to upload.");
    setError(""); setLoading(true); setProgress(0);
    try {
      await onSubmit({ ...form, file: useFile ? file : null }, setProgress);
      onClose();
    } catch (err) {
      console.error(err);
      window.alert("Error: " + (err.message || "Something went wrong"));
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

          {/* Course */}
          <div className="field">
            <label>Course *</label>
            <select value={form.courseCode} onChange={e => set("courseCode", e.target.value)}>
              {ALL_COURSES.map(c => (
                <option key={c.code} value={c.code}>{c.code} – {c.title}</option>
              ))}
            </select>
          </div>

          {/* Type pills */}
          <div className="field">
            <label>Resource Type *</label>
            <div className={s.typePicker}>
              {TYPES.map(t => (
                <button key={t} type="button"
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
                onChange={e => { setFile(e.target.files[0]); setError(""); }} />
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
