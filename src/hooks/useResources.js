// src/hooks/useResources.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export function useResources() {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState(() => {
    try {
      const cached = localStorage.getItem("amrita_resources_cache");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading,   setLoading]   = useState(resources.length === 0);
  const [error,     setError]     = useState(null);

  const fetchResources = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/resources?select=*&order=created_at.desc`, {
        headers: {
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load resources: HTTP ${res.status}`);
      }
      const data = await res.json();
      setResources(data || []);
      try {
        localStorage.setItem("amrita_resources_cache", JSON.stringify(data || []));
      } catch (e) {}
    } catch (err) {
      setError("Could not load resources. Check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchResources();
      }
    };
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchResources]);

  // ── Add resource (file upload OR link) ──────────────────────────────────
  async function addResource({ title, courseCode, type, link, description, file }, onProgress) {
    if (!user) throw new Error("Not authenticated");

    let token = process.env.REACT_APP_SUPABASE_ANON_KEY;
    try {
      const stored = localStorage.getItem("sb-bkugqqsjnrcrxgomjvda-auth-token") ||
                     localStorage.getItem("amritahub-auth") ||
                     localStorage.getItem("supabase.auth.token");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token) {
          token = parsed.access_token;
        } else if (parsed?.currentSession?.access_token) {
          token = parsed.currentSession.access_token;
        }
      }
    } catch (e) {}

    let fileURL  = link?.trim() || "";
    let fileName = "";

    if (file) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const path = `${Date.now()}_${cleanName}`;
      onProgress?.(10);

      let uploadError = null;
      let fakeProgressInterval;

      try {
        let currentProg = 10;
        fakeProgressInterval = setInterval(() => {
          currentProg += Math.floor(Math.random() * 5) + 2;
          if (currentProg > 75) currentProg = 75;
          onProgress?.(currentProg);
        }, 500);

        const uploadUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/resources/${path}`;
        
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
            "Content-Type": file.type || "application/octet-stream",
            "Cache-Control": "3600"
          },
          body: file
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.message || `Upload failed with status: ${uploadRes.status}`);
        }

        clearInterval(fakeProgressInterval);
      } catch (err) {
        uploadError = err;
      } finally {
        clearInterval(fakeProgressInterval);
      }

      if (uploadError) throw new Error("File upload failed: " + uploadError.message);
      onProgress?.(80);

      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
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

    // Database insert using raw REST fetch to completely bypass SDK hangs
    const insertRes = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        "Authorization": `Bearer ${token}`,
        "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(newResource),
    });

    if (!insertRes.ok) {
      const errData = await insertRes.json().catch(() => ({}));
      throw new Error(errData.message || `Sharing failed with status: ${insertRes.status}`);
    }

    const data = await insertRes.json().catch(() => null);
    const insertedItem = (Array.isArray(data) && data.length > 0)
      ? data[0]
      : { ...newResource, id: Date.now().toString(), created_at: new Date().toISOString() };

    setResources(prev => [insertedItem, ...prev]);

    try {
      localStorage.setItem("amrita_resources_cache", JSON.stringify([insertedItem, ...resources]));
    } catch (e) {}
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

  // ── Delete resource ────────────────────────────────────────────────────────
  async function deleteResource(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r || r.uploaded_by !== user.id) return;

    setResources(prev => prev.filter(x => x.id !== resourceId));

    let token = process.env.REACT_APP_SUPABASE_ANON_KEY;
    try {
      const stored = localStorage.getItem("sb-bkugqqsjnrcrxgomjvda-auth-token") ||
                     localStorage.getItem("amritahub-auth") ||
                     localStorage.getItem("supabase.auth.token");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.access_token) {
          token = parsed.access_token;
        } else if (parsed?.currentSession?.access_token) {
          token = parsed.currentSession.access_token;
        }
      }
    } catch (e) {}

    try {
      const deleteRes = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/resources?id=eq.${resourceId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
        }
      });

      if (!deleteRes.ok) {
        throw new Error(`Direct delete failed with status: ${deleteRes.status}`);
      }
    } catch (err) {
      console.error("Failed to delete resource:", err);
      fetchResources();
    }
  }

  return {
    resources,
    loading,
    error,
    addResource,
    toggleVote,
    toggleSave,
    addComment,
    deleteResource,
    refetch: fetchResources,
  };
}
