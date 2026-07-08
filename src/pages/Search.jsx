// src/pages/Search.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X, SlidersHorizontal, Trash2 } from "lucide-react";
import { useResources } from "../hooks/useResources";
import ResourceCard from "../components/ResourceCard";
import s from "./Search.module.css";

const TYPES = ["All", "Notes", "PDF", "Video", "Article", "Practice"];
const SEMESTERS = [
  "All",
  "Semester I",
  "Semester II",
  "Semester III",
  "Semester IV",
  "Semester V",
  "Semester VI",
  "Semester VII",
  "Semester VIII",
  "Electives"
];

export default function Search() {
  const { resources, loading, error, toggleVote, toggleSave, deleteResource, reportResource, allCourses } = useResources();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search input state
  const queryParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(queryParam);
  const inputRef = useRef(null);

  // Sync state with URL change
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  // Filters state
  const [type, setType] = useState("All");
  const [sem, setSem] = useState("All");
  const [tag, setTag] = useState("All");
  const [course, setCourse] = useState("All");
  const [sort, setSort] = useState("relevance");

  // Focus input on shortcut / slash press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        // Only if not focused on another input
        if (
          document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          document.activeElement.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update query param
  const handleQueryChange = (val) => {
    setQuery(val);
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      searchParams.delete("q");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleClear = () => {
    setQuery("");
    searchParams.delete("q");
    setSearchParams(searchParams, { replace: true });
    inputRef.current?.focus();
  };

  // Get all unique tags from active resources
  const allTags = useMemo(() => {
    const tagSet = new Set();
    resources.forEach((r) => {
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t) => t && tagSet.add(t));
      }
    });
    return ["All", ...Array.from(tagSet)];
  }, [resources]);

  // Compute matched/scored search list
  const filteredResources = useMemo(() => {
    let list = [...resources];

    // Apply strict filters first
    if (type !== "All") {
      list = list.filter((r) => r.type === type);
    }
    if (tag !== "All") {
      list = list.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag));
    }
    if (course !== "All") {
      list = list.filter((r) => r.course_code === course);
    }

    // Filter by Semester using course lookup
    if (sem !== "All") {
      list = list.filter((r) => {
        const found = allCourses.find((c) => c.code === r.course_code);
        if (!found) return false;
        if (sem === "Electives") {
          return !SEMESTERS.includes(found.semester);
        }
        return found.semester === sem;
      });
    }

    // Apply search query text search & scoring
    const searchTerms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const fullQuery = query.toLowerCase().trim();

    if (searchTerms.length > 0) {
      // Filter list and calculate scores for relevance sorting
      list = list
        .map((r) => {
          let score = 0;
          const rTitle = r.title.toLowerCase();
          const rDesc = (r.description || "").toLowerCase();
          const rCode = r.course_code.toLowerCase();
          const rName = (r.uploader_name || "").toLowerCase();

          // Course lookup for searching syllabus course titles
          const courseDetail = allCourses.find((c) => c.code === r.course_code);
          const courseTitle = courseDetail ? courseDetail.title.toLowerCase() : "";

          // 1. Phrase Matches (highest score)
          if (rTitle.includes(fullQuery)) score += 30;
          if (courseTitle.includes(fullQuery)) score += 25;
          if (rCode.includes(fullQuery)) score += 20;
          if (rDesc.includes(fullQuery)) score += 5;

          // 2. Individual Terms Matches (cumulative scores)
          searchTerms.forEach((term) => {
            if (rTitle.includes(term)) score += 8;
            if (courseTitle.includes(term)) score += 6;
            if (rCode.includes(term)) score += 5;
            if (rDesc.includes(term)) score += 2;
            if (rName.includes(term)) score += 2;

            if (Array.isArray(r.tags)) {
              r.tags.forEach((t) => {
                if (t.toLowerCase() === term) score += 3;
              });
            }
          });

          return { ...r, _score: score };
        })
        .filter((r) => r._score > 0);
    }

    // Apply sorting
    if (sort === "recent") {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sort === "votes") {
      list.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    } else {
      // sort by relevance score if query is present, otherwise recent
      if (searchTerms.length > 0) {
        list.sort((a, b) => b._score - a._score);
      } else {
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }
    }

    return list;
  }, [resources, query, type, sem, tag, course, sort, allCourses]);

  const handleResetFilters = () => {
    setType("All");
    setSem("All");
    setTag("All");
    setCourse("All");
    setSort("relevance");
  };

  return (
    <div className={s.page}>
      {/* Header with Search Input */}
      <div className={s.searchHeader}>
        <h1 className={s.searchTitle}>Advanced Resource Finder</h1>
        <p className={s.searchSub}>Precision filtering across notes, PYQs, and syllabus</p>

        <div className={s.searchBarContainer}>
          <SearchIcon size={20} className={s.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={s.searchInput}
            placeholder="Type search queries, topics, or course codes..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            autoFocus
          />
          {query ? (
            <button className={s.clearButton} onClick={handleClear} title="Clear search">
              <X size={18} />
            </button>
          ) : (
            <span className={s.shortcutHint}>/</span>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar + Results */}
      <div className={s.layout}>
        {/* Filter Sidebar */}
        <aside className={s.sidebar}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: "8px", borderBottom: "1px solid var(--bdr)", paddingBottom: "12px" }}>
            <SlidersHorizontal size={16} style={{ color: "var(--cr)" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Filters & Tools</span>
          </div>

          {/* Filter 1: Resource Type */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Resource Type</label>
            <select className={s.selectInput} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "All" ? "All Types" : t}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Semester */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Semester Group</label>
            <select className={s.selectInput} value={sem} onChange={(e) => setSem(e.target.value)}>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Semesters" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Specific Course Code */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Filter by Course</label>
            <select className={s.selectInput} value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="All">All Courses</option>
              {allCourses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Sort option */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Sort Order</label>
            <select className={s.selectInput} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Best Matches (Relevance)</option>
              <option value="recent">Upload Date (Recent First)</option>
              <option value="votes">Student Rating (Votes First)</option>
            </select>
          </div>

          {/* Filter 5: Tags */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel}>Filter by Tag</label>
            <div className={s.tagButtonGrid}>
              {allTags.slice(0, 15).map((t) => (
                <button
                  key={t}
                  className={`${s.tagButton} ${tag === t ? s.tagButtonActive : ""}`}
                  onClick={() => setTag(t)}
                >
                  {t === "All" ? "All Tags" : `#${t}`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={s.mainSection}>
          {/* Top Result Count Bar */}
          <div className={s.resultCountBar}>
            <div>
              <span>
                Found <strong>{filteredResources.length}</strong> matching resource
                {filteredResources.length !== 1 ? "s" : ""}
              </span>
              {query && (
                <span style={{ marginLeft: "6px", color: "var(--muted)" }}>
                  for "<em>{query}</em>"
                </span>
              )}
            </div>
            {(type !== "All" || sem !== "All" || tag !== "All" || course !== "All") && (
              <button className={s.resetAll} onClick={handleResetFilters}>
                Clear filters
              </button>
            )}
          </div>

          {/* Error Banner */}
          {error && <div className="alert alert-danger">⚠️ {error}</div>}

          {/* Loading or Grid Results */}
          {loading ? (
            <div className="loading-center" style={{ minHeight: "200px" }}>
              <div className="spinner" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>🔍</div>
              <h3 className={s.emptyTitle}>No resources found</h3>
              <p className={s.emptyText}>
                No entries matched your combined query and filters. Try adjusting keywords or resetting filters.
              </p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: "16px" }} onClick={handleResetFilters}>
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className={s.grid}>
              {filteredResources.map((r, i) => (
                <div key={r.id} style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                  <ResourceCard
                    resource={r}
                    onVote={toggleVote}
                    onSave={toggleSave}
                    onDelete={deleteResource}
                    onReport={reportResource}
                    searchQ={query}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
