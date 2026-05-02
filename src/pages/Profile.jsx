import { useAuth } from "../context/AuthContext";
import { useResources } from "../hooks/useResources";
import ResourceCard from "../components/ResourceCard";
import s from "./Profile.module.css";
import { User, Upload, Star, Bookmark } from "lucide-react";

export default function Profile() {
  const { user, profile } = useAuth();
  const { resources, toggleVote, toggleSave } = useResources();

  if (!user) return null;

  const userUploads = resources.filter((r) => r.uploaded_by === user.id);
  
  // Calculate total upvotes received across all uploads
  const totalUpvotesReceived = userUploads.reduce((acc, curr) => acc + (curr.votes || 0), 0);
  
  // Calculate total saved items
  const totalSaved = profile?.savedResources?.length || 0;

  const initials = (profile?.name || user.displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-container anim-fadeUp">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">View your stats and manage your uploads</p>
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
          <Upload className={s.statIcon} size={24} />
          <div className={s.statInfo}>
            <span className={s.statValue}>{userUploads.length}</span>
            <span className={s.statLabel}>Uploads</span>
          </div>
        </div>
        <div className={s.statCard}>
          <Star className={s.statIcon} size={24} />
          <div className={s.statInfo}>
            <span className={s.statValue}>{totalUpvotesReceived}</span>
            <span className={s.statLabel}>Upvotes Received</span>
          </div>
        </div>
        <div className={s.statCard}>
          <Bookmark className={s.statIcon} size={24} />
          <div className={s.statInfo}>
            <span className={s.statValue}>{totalSaved}</span>
            <span className={s.statLabel}>Saved Items</span>
          </div>
        </div>
      </div>

      <h3 className={s.sectionTitle}>Your Uploads</h3>
      {userUploads.length === 0 ? (
        <div className={s.emptyState}>
          <Upload size={48} className={s.emptyIcon} />
          <p className={s.emptyText}>You haven&#39;t uploaded any resources yet.</p>
        </div>
      ) : (
        <div className={s.grid}>
          {userUploads.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onVote={() => toggleVote(resource.id)}
              onSave={() => toggleSave(resource.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
