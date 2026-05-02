// src/pages/Saved.jsx
import { useMemo } from "react";
import { useResources } from "../hooks/useResources";
import { useAuth } from "../context/AuthContext";
import ResourceCard from "../components/ResourceCard";
import s from "./SimplePage.module.css";

export default function Saved() {
  const { user } = useAuth();
  const { resources, loading, toggleVote, toggleSave } = useResources();
  const saved = useMemo(() => resources.filter(r => r.saved_by?.includes(user?.id)), [resources, user]);

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.pageHeader}>
          <h1 className={s.heading}>🔖 Saved Resources</h1>
          <p className={s.sub}>Your personal reading list</p>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : saved.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔖</div>
            <h3>Nothing saved yet</h3>
            <p>Tap the bookmark icon on any resource to save it here for quick access.</p>
          </div>
        ) : (
          <>
            <p className={s.count}>{saved.length} saved resource{saved.length !== 1 ? "s" : ""}</p>
            <div className={s.grid}>
              {saved.map(r => (
                <ResourceCard key={r.id} resource={r} onVote={toggleVote} onSave={toggleSave} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
