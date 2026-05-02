import { useAuth } from "../context/AuthContext";
import { useResources } from "../hooks/useResources";
import ResourceCard from "../components/ResourceCard";
import s from "./Profile.module.css";
import { User, Upload, Star, Bookmark } from "lucide-react";

export default function Profile() {
  const { user, profile } = useAuth();
  const { resources, toggleVote, toggleSave, deleteResource } = useResources();

  if (!user) return null;

  const userUploads = resources.filter((r) => r.uploaded_by === user.id);
  
  // Calculate total upvotes received across all uploads
  const totalUpvotesReceived = userUploads.reduce((acc, curr) => acc + (curr.votes || 0), 0);
  
  // Calculate total saved items
  const totalSaved = resources.filter(r => Array.isArray(r.saved_by) && r.saved_by.includes(user.id)).length;

  const initials = (profile?.name || user.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container anim-fadeUp" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: 900, color: "#1a1f36", letterSpacing: "-0.03em" }}>Account Profile</h1>
        <p className="page-subtitle" style={{ color: "#718096", fontSize: "1rem" }}>View your personal upload statistics and manage your study resources</p>
      </div>

      <div className={s.profileHeader}>
        <div className={s.avatarLarge}>{initials}</div>
        <div className={s.userInfo}>
          <h2 className={s.userName}>{profile?.name || user.displayName || "Student"}</h2>
          <p className={s.userEmail}>{profile?.email || user.email}</p>
          <div className={s.userMeta}>
            <span className={s.department}>{profile?.department || "CSE"}</span>
            <span className={s.year}>{profile?.year || "Unknown Year"}</span>
          </div>
        </div>
      </div>

      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={s.statIconWrapper}>
            <Upload size={22} />
          </div>
          <div className={s.statInfo}>
            <span className={s.statValue}>{userUploads.length}</span>
            <span className={s.statLabel}>Uploads</span>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statIconWrapper}>
            <Star size={22} />
          </div>
          <div className={s.statInfo}>
            <span className={s.statValue}>{totalUpvotesReceived}</span>
            <span className={s.statLabel}>Upvotes Received</span>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.statIconWrapper}>
            <Bookmark size={22} />
          </div>
          <div className={s.statInfo}>
            <span className={s.statValue}>{totalSaved}</span>
            <span className={s.statLabel}>Saved Items</span>
          </div>
        </div>
      </div>

      <h3 className={s.sectionTitle}>
        <Upload size={18} /> Your Uploads
      </h3>
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
  );
}
