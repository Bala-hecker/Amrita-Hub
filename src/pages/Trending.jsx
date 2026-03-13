// src/pages/Trending.jsx
import { useMemo } from "react";
import { useResources } from "../hooks/useResources";
import ResourceCard from "../components/ResourceCard";
import s from "./SimplePage.module.css";

export default function Trending() {
  const { resources, loading, toggleVote, toggleSave } = useResources();
  const sorted = useMemo(() => [...resources].sort((a,b) => b.votes - a.votes), [resources]);

  const MEDALS = ["🥇","🥈","🥉"];

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.pageHeader}>
          <h1 className={s.heading}>🏆 Top Voted Resources</h1>
          <p className={s.sub}>The most helpful materials — as voted by your peers</p>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏆</div>
            <h3>No resources yet</h3>
            <p>Be the first to share a resource and get voted up!</p>
          </div>
        ) : (
          <div className={s.grid}>
            {sorted.map((r,i) => (
              <div key={r.id} className={s.ranked}>
                {i < 3 && <div className={s.medal}>{MEDALS[i]}</div>}
                {i >= 3 && <div className={s.rankNum}>#{i+1}</div>}
                <ResourceCard resource={r} onVote={toggleVote} onSave={toggleSave} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
