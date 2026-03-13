// src/hooks/useResources.js
import { useState, useEffect, useCallback } from "react";
import {
  collection, addDoc, getDocs, doc, updateDoc,
  arrayUnion, arrayRemove, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useResources() {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q    = query(collection(db, "resources"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError("Could not load resources. Check your Firebase config.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── Add resource (file upload OR link) ──────────────────────────────────
  async function addResource({ title, courseCode, type, link, description, file }, onProgress) {
    if (!user) throw new Error("Not authenticated");

    let fileURL  = link?.trim() || "";
    let fileName = "";

    if (file) {
      const path       = `resources/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task       = uploadBytesResumable(storageRef, file);

      await new Promise((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          resolve
        );
      });
      fileURL  = await getDownloadURL(task.snapshot.ref);
      fileName = file.name;
    }

    const docRef = await addDoc(collection(db, "resources"), {
      title:        title.trim(),
      courseCode,
      type,
      link:         fileURL,
      fileName,
      description:  description?.trim() || "",
      uploadedBy:   user.uid,
      uploaderName: profile?.name || user.displayName || "Student",
      votes:   0,
      votedBy: [],
      savedBy: [],
      createdAt: serverTimestamp(),
    });

    // Optimistic update so UI refreshes immediately
    setResources(prev => [{
      id: docRef.id, title: title.trim(), courseCode, type,
      link: fileURL, fileName, description: description?.trim() || "",
      uploadedBy: user.uid, uploaderName: profile?.name || "You",
      votes: 0, votedBy: [], savedBy: [],
      createdAt: { seconds: Date.now() / 1000 },
    }, ...prev]);
  }

  // ── Toggle upvote ────────────────────────────────────────────────────────
  async function toggleVote(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r) return;
    const hasVoted = r.votedBy?.includes(user.uid);

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? {
            ...x,
            votes:   hasVoted ? x.votes - 1 : x.votes + 1,
            votedBy: hasVoted
              ? x.votedBy.filter(id => id !== user.uid)
              : [...(x.votedBy || []), user.uid],
          }
        : x
    ));

    try {
      await updateDoc(doc(db, "resources", resourceId), {
        votedBy: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid),
        votes:   hasVoted ? (r.votes || 1) - 1    : (r.votes || 0) + 1,
      });
    } catch (e) {
      // Rollback on failure
      fetchResources();
    }
  }

  // ── Toggle bookmark ──────────────────────────────────────────────────────
  async function toggleSave(resourceId) {
    if (!user) return;
    const r = resources.find(x => x.id === resourceId);
    if (!r) return;
    const hasSaved = r.savedBy?.includes(user.uid);

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? {
            ...x,
            savedBy: hasSaved
              ? x.savedBy.filter(id => id !== user.uid)
              : [...(x.savedBy || []), user.uid],
          }
        : x
    ));

    try {
      await updateDoc(doc(db, "resources", resourceId), {
        savedBy: hasSaved ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      await updateDoc(doc(db, "users", user.uid), {
        savedResources: hasSaved ? arrayRemove(resourceId) : arrayUnion(resourceId),
      });
    } catch (e) {
      fetchResources();
    }
  }

  // ── Add comment ──────────────────────────────────────────────────────────
  async function addComment(resourceId, text) {
    if (!user) return;
    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      uid: user.uid,
      name: profile?.name || user.displayName || "Student",
      createdAt: Date.now()
    };

    // Optimistic UI
    setResources(prev => prev.map(x =>
      x.id === resourceId
        ? { ...x, comments: [...(x.comments || []), newComment] }
        : x
    ));

    try {
      await updateDoc(doc(db, "resources", resourceId), {
        comments: arrayUnion(newComment)
      });
    } catch (e) {
      fetchResources();
    }
  }

  return { resources, loading, error, addResource, toggleVote, toggleSave, addComment, refetch: fetchResources };
}
