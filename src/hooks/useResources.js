// src/hooks/useResources.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export function useResources() {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError("Could not load resources. Check your Supabase config.");
      console.error(err);
    } else {
      setResources(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── Add resource (file upload OR link) ──────────────────────────────────
  async function addResource({ title, courseCode, type, link, description, file }, onProgress) {
    if (!user) throw new Error("Not authenticated");

    let fileURL  = link?.trim() || "";
    let fileName = "";

    if (file) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      onProgress?.(10);

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error("File upload failed: " + uploadError.message);
      onProgress?.(80);

      const { data: urlData } = supabase.storage
        .from("resources")
        .getPublicUrl(path);

      fileURL  = urlData.publicUrl;
      fileName = file.name;
      onProgress?.(100);
    }

    const newResource = {
      title:         title.trim(),
      course_code:   courseCode,
      type,
      link:          fileURL,
      file_name:     fileName,
      description:   description?.trim() || "",
      uploaded_by:   user.id,
      uploader_name: profile?.name || "Student",
      votes:         0,
      voted_by:      [],
      saved_by:      [],
      comments:      [],
    };

    const { data, error: insertError } = await supabase
      .from("resources")
      .insert(newResource)
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    // Optimistic update
    setResources(prev => [data, ...prev]);
  }

  // ── Toggle upvote ────────────────────────────────────────────────────────
  async function toggleVote(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r) return;

    const hasVoted   = r.voted_by?.includes(user.id);
    const newVotedBy = hasVoted
      ? r.voted_by.filter(id => id !== user.id)
      : [...(r.voted_by || []), user.id];
    const newVotes   = hasVoted ? (r.votes || 1) - 1 : (r.votes || 0) + 1;

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? { ...x, votes: newVotes, voted_by: newVotedBy }
        : x
    ));

    const { error } = await supabase
      .from("resources")
      .update({ votes: newVotes, voted_by: newVotedBy })
      .eq("id", resourceId);

    if (error) fetchResources();
  }

  // ── Toggle bookmark ──────────────────────────────────────────────────────
  async function toggleSave(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r) return;

    const hasSaved   = r.saved_by?.includes(user.id);
    const newSavedBy = hasSaved
      ? r.saved_by.filter(id => id !== user.id)
      : [...(r.saved_by || []), user.id];

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? { ...x, saved_by: newSavedBy }
        : x
    ));

    const { error } = await supabase
      .from("resources")
      .update({ saved_by: newSavedBy })
      .eq("id", resourceId);

    if (error) fetchResources();
  }

  // ── Add comment ──────────────────────────────────────────────────────────
  async function addComment(resourceId, text) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r) return;

    const newComment = {
      id:        Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text:      text.trim(),
      uid:       user.id,
      name:      profile?.name || "Student",
      createdAt: Date.now(),
    };

    const updatedComments = [...(r.comments || []), newComment];

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? { ...x, comments: updatedComments }
        : x
    ));

    const { error } = await supabase
      .from("resources")
      .update({ comments: updatedComments })
      .eq("id", resourceId);

    if (error) fetchResources();
  }

  return {
    resources,
    loading,
    error,
    addResource,
    toggleVote,
    toggleSave,
    addComment,
    refetch: fetchResources,
  };
}
