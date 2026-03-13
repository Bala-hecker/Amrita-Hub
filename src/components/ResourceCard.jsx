import { useState } from "react";
import { Bookmark, Star, ExternalLink, FileText, Video, BookOpen, Newspaper, Dumbbell, MessageSquare } from "lucide-react";
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

export default function ResourceCard({ resource, onVote, onSave }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const hasVoted  = resource.votedBy?.includes(user?.uid);
  const hasSaved  = resource.savedBy?.includes(user?.uid);
  const course    = getCourse(resource.courseCode);
  const commentsCount = resource.comments?.length || 0;

  return (
    <article className={`${s.card} anim-fadeUp`}>
      {/* Type + save */}
      <div className={s.top}>
        <span className={`badge badge-${resource.type}`}>
          {TYPE_ICON[resource.type]} {resource.type}
        </span>
        <button
          className={`${s.saveBtn} ${hasSaved ? s.saved : ""}`}
          onClick={() => onSave(resource.id)}
          title={hasSaved ? "Remove bookmark" : "Save resource"}
          aria-label="Bookmark"
        >
          <Bookmark size={15} fill={hasSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Course code + title */}
      <div className={s.code}>{resource.courseCode}</div>
      <h3 className={s.title}>{resource.title}</h3>

      {/* Course name */}
      {course && <div className={s.coursePill} title={course.title}>{course.title}</div>}

      {/* Description */}
      {resource.description && <p className={s.desc}>{resource.description}</p>}

      {/* Footer */}
      <div className={s.footer}>
        <span className={s.uploader}>
          <span className={s.uploaderBy}>by</span>
          <strong>{resource.uploaderName}</strong>
        </span>
        <div className={s.actions}>
          {resource.link && (
            <a
              href={resource.link} target="_blank" rel="noopener noreferrer"
              className={s.linkBtn} title="Open resource"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
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
            onClick={() => onVote(resource.id)}
            title={hasVoted ? "Remove vote" : "Upvote"}
          >
            <Star size={12} fill={hasVoted ? "currentColor" : "none"} />
            <span>{resource.votes}</span>
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
