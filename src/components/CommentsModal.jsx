import { useState } from "react";
import { X, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useResources } from "../hooks/useResources";
import s from "./CommentsModal.module.css";

export default function CommentsModal({ resource, onClose }) {
  const { user } = useAuth();
  const { addComment } = useResources();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Close when clicking background
  function handleBgClick(e) {
    if (e.target.dataset.bg) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await addComment(resource.id, text);
    setText("");
    setSubmitting(false);
  }

  const comments = resource.comments || [];

  return (
    <div className={s.overlay} data-bg="true" onClick={handleBgClick}>
      <div className={`${s.modal} anim-fadeUp`}>
        <div className={s.header}>
          <div className={s.headerText}>
            <h2>Comments</h2>
            <p className={s.subtitle}>{resource.title}</p>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={s.commentsList}>
          {comments.length === 0 ? (
            <div className={s.emptyState}>No comments yet. Be the first!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className={s.commentItem}>
                <div className={s.commentMeta}>
                  <strong>{c.name}</strong>
                  <span className={s.time}>
                    {new Date(c.createdAt).toLocaleDateString()}{" "}
                    {new Date(c.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={s.commentText}>{c.text}</div>
              </div>
            ))
          )}
        </div>

        {user && (
          <form className={s.inputForm} onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={s.input}
              disabled={submitting}
            />
            <button
              type="submit"
              className={s.sendBtn}
              disabled={!text.trim() || submitting}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
