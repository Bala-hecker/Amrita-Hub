import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Star, ExternalLink, FileText, Video, BookOpen, Newspaper, Dumbbell, MessageSquare, Trash2, Flag, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getCourse } from "../data/curriculum";
import CommentsModal from "./CommentsModal";
import s from "./ResourceCard.module.css";

const TYPE_ICON = {
  PDF:      <FileText size={11} />,
  Notes:    <BookOpen size={11} />,
  Video:    <Video size={11} />,
  Article:  <Newspaper size={11} />,
  Practice: <Dumbbell size={11} />,
};

function HighlightText({ text, highlight }) {
  if (!text) return "";
  if (!highlight || !highlight.trim()) return <span>{text}</span>;

  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: "rgba(192, 0, 60, 0.15)", color: "var(--cr)", fontWeight: "bold", padding: "0 2px", borderRadius: "3px" }}>{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function ResourceCard({ resource, onVote, onSave, onDelete, onReport, searchQ = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const hasVoted  = resource.voted_by?.includes(user?.id);
  const hasSaved  = resource.saved_by?.includes(user?.id);
  const course    = getCourse(resource.course_code);
  const commentsCount = resource.comments?.length || 0;
  const reportsCount = resource.reports?.length || 0;
  const hasReported = resource.reports?.some(rep => rep.uid === user?.id);

  if (reportsCount > 0) return null;

  return (
    <article className={`${s.card} anim-fadeUp`}>
      {/* Type + save */}
      <div className={s.top}>
        <span className={`badge badge-${resource.type}`}>
          {TYPE_ICON[resource.type]} {resource.type}
        </span>
        {reportsCount > 0 && (
          <span style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            color: "#DC2626",
            background: "rgba(220,38,38,0.1)",
            padding: "2px 8px",
            borderRadius: "12px",
            marginLeft: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "3.5px"
          }}>
            <AlertTriangle size={10} /> Flagged ({reportsCount})
          </span>
        )}
        <button
          className={`${s.saveBtn} ${hasSaved ? s.saved : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!user) {
              navigate("/login");
            } else {
              onSave(resource.id);
            }
          }}
          title={hasSaved ? "Remove bookmark" : "Save resource"}
          aria-label="Bookmark"
        >
          <Bookmark size={15} fill={hasSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Course code + title */}
      <div className={s.code}><HighlightText text={resource.course_code} highlight={searchQ} /></div>
      <h3 className={s.title}><HighlightText text={resource.title} highlight={searchQ} /></h3>

      {/* Course name */}
      {course && <div className={s.coursePill} title={course.title}>{course.title}</div>}

      {/* Tags */}
      {resource.tags && resource.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", margin: "6px 0" }}>
          {resource.tags.map(t => (
            <span key={t} style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              background: "var(--bg)",
              color: "var(--muted)",
              padding: "2px 8px",
              borderRadius: "10px",
              border: "1px solid var(--bdr)"
            }}>
              #<HighlightText text={t} highlight={searchQ} />
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {resource.description && <p className={s.desc}><HighlightText text={resource.description} highlight={searchQ} /></p>}

      {/* Footer */}
      <div className={s.footer}>
        <span className={s.uploader}>
          <span className={s.uploaderBy}>by</span>
          <strong>{resource.uploader_name}</strong>
        </span>
        <div className={s.actions}>
          {resource.link && (
            <a
              href={resource.link} target="_blank" rel="noopener noreferrer"
              className={s.linkBtn} title="Open resource"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/login");
                } else {
                  e.stopPropagation();
                }
              }}
            >
              <ExternalLink size={13} />
            </a>
          )}
          {user?.id === resource.uploaded_by && onDelete && (
            <button
              className={s.linkBtn}
              style={{ color: "var(--red-light)" }}
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this resource? This cannot be undone.")) {
                  onDelete(resource.id);
                }
              }}
              title="Delete resource"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            className={s.commentBtn}
            onClick={() => setShowComments(true)}
            title="Comments"
          >
            <MessageSquare size={13} />
            <span>{commentsCount}</span>
          </button>
          <button
            className={`${s.voteBtn} ${hasVoted ? s.voted : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                navigate("/login");
              } else {
                onVote(resource.id);
              }
            }}
            title={hasVoted ? "Remove vote" : "Upvote"}
          >
            <Star size={12} fill={hasVoted ? "currentColor" : "none"} />
            <span>{resource.votes}</span>
          </button>
          <button
            className={s.voteBtn}
            style={hasReported ? { color: "#DC2626" } : {}}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                navigate("/login");
              } else if (hasReported) {
                alert("You have already reported this resource.");
              } else {
                if (window.confirm("Are you sure you want to report/flag this resource as incorrect, spam, or inappropriate?")) {
                  onReport(resource.id);
                }
              }
            }}
            title={hasReported ? "Reported" : "Report / Flag Resource"}
          >
            <Flag size={12} fill={hasReported ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsModal
          resource={resource}
          onClose={() => setShowComments(false)}
        />
      )}
    </article>
  );
}
