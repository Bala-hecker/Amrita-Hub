// src/hooks/useResources.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export function useResources() {
  const { user, profile, session } = useAuth();
  // Load from localStorage optimistically for permanent instant refresh
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
    const { data, error: err } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError("Could not load resources. Check your Supabase config.");
      console.error(err);
    } else {
      setResources(data || []);
      try {
        localStorage.setItem("amrita_resources_cache", JSON.stringify(data || []));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchResources(); 
    
    // Auto-refresh when the user switches back to this tab
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
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

    let fileURL  = link?.trim() || "";
    let fileName = "";

    if (file) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const path = `${Date.now()}_${cleanName}`;
      onProgress?.(10);

      let uploadError = null;
      let fakeProgressInterval;
      
      try {
        // Start faking progress to show it is active
        let currentProg = 10;
        fakeProgressInterval = setInterval(() => {
          currentProg += Math.floor(Math.random() * 5) + 2;
          if (currentProg > 75) currentProg = 75;
          onProgress?.(currentProg);
        }, 500);

        // ALWAYS force-refresh the session token before uploading.
        // This fixes the "need to clear cache every time" bug caused by stale tokens.
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData?.session) {
          throw new Error("Your login session expired. Please log out and log in again.");
        }
        const token = refreshData.session.access_token;

        const uploadUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/resources/${path}`;
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Upload timed out. Check your internet connection.")), 25000)
        );

        const fetchPromise = fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
            "Content-Type": file.type || "application/octet-stream",
            "Cache-Control": "3600"
          },
          body: file
        }).then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Upload failed: HTTP ${res.status}`);
          }
          return res;
        });

        await Promise.race([fetchPromise, timeoutPromise]);
        clearInterval(fakeProgressInterval);
      } catch (err) {
        uploadError = err;
      } finally {
        clearInterval(fakeProgressInterval);
      }

      if (uploadError) {
        throw new Error(uploadError.message || "File upload failed");
      }
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

    // Send the database insert and wait for confirmation before updating UI
    const { data, error: insertError } = await supabase
      .from("resources")
      .insert(newResource)
      .select();

    if (insertError) throw new Error(insertError.message);

    const insertedItem = (data && data.length > 0) ? data[0] : { ...newResource, id: Date.now().toString(), created_at: new Date().toISOString() };
    
    // Update UI only after successful database insert
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

  // ── Delete resource ────────────────────────────────────────────────────────
  async function deleteResource(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r || r.uploaded_by !== user.id) return;

    // Optimistic UI
    setResources(prev => prev.filter(x => x.id !== resourceId));

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);

    if (error) {
      console.error("Failed to delete resource:", error);
      fetchResources(); // Revert on failure
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
