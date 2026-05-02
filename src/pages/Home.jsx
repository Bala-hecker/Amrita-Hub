// src/pages/Home.jsx
import { useState, useMemo } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { SEMESTERS } from "../data/curriculum";
import { useResources } from "../hooks/useResources";
import { useAuth } from "../context/AuthContext";
import ResourceCard from "../components/ResourceCard";
import AddResourceModal from "../components/AddResourceModal";
import s from "./Home.module.css";

const TYPES = ["All","Notes","PDF","Video","Article","Practice"];

export default function Home() {
  const { user, profile } = useAuth();
  const { resources, loading, error, addResource, toggleVote, toggleSave, deleteResource } = useResources();

  const [showModal,   setShowModal]   = useState(false);
  const [searchQ,     setSearchQ]     = useState("");
  const [filterSub,   setFilterSub]   = useState("All");
  const [filterType,  setFilterType]  = useState("All");
  const [sort,        setSort]        = useState("recent");
  const [sideOpen,    setSideOpen]    = useState(false);

  const filtered = useMemo(() => {
    let list = [...resources];
    if (filterSub  !== "All") list = list.filter(r => r.course_code === filterSub);
    if (filterType !== "All") list = list.filter(r => r.type         === filterType);
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.course_code.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.uploader_name?.toLowerCase().includes(q)
      );
    }
    if (sort === "votes")  list.sort((a,b) => b.votes - a.votes);
    if (sort === "recent") list.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
    if (sort === "mine")   list = list.filter(r => r.uploaded_by === user?.id);
    return list;
  }, [resources, filterSub, filterType, searchQ, sort, user]);

  const countByCode = useMemo(() => {
    const m = {};
    resources.forEach(r => { m[r.course_code] = (m[r.course_code] || 0) + 1; });
    return m;
  }, [resources]);

  const top5 = useMemo(() =>
    [...resources].sort((a,b) => b.votes - a.votes).slice(0,5), [resources]);

  const firstName = profile?.name?.split(" ")[0] || "Student";
  const savedCount = resources.filter(r => r.saved_by?.includes(user?.id)).length;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroLeft}>
          <h1 className={s.heroTitle}>Welcome back, {firstName} 👋</h1>
          <p className={s.heroSub}>Discover, share and organise CSE study materials with your peers</p>
        </div>
        <div className={s.heroStats}>
          <div className={s.stat}><span className={s.statN}>{resources.length}</span><span className={s.statL}>Resources</span></div>
          <div className={s.statDiv} />
          <div className={s.stat}><span className={s.statN}>8</span><span className={s.statL}>Semesters</span></div>
          <div className={s.statDiv} />
          <div className={s.stat}><span className={s.statN}>{savedCount}</span><span className={s.statL}>Saved</span></div>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      <div className={s.mobileBar}>
        <button className={s.filterToggle} onClick={() => setSideOpen(o => !o)}>
          <SlidersHorizontal size={15} />
          {filterSub !== "All" ? `Course: ${filterSub}` : "Filter by Course"}
        </button>
        <button className={`btn btn-primary btn-sm ${s.mobileAdd}`} onClick={() => setShowModal(true)}>
          <Plus size={14} /> Share
        </button>
      </div>

      <div className={s.layout}>
        {/* Sidebar overlay on mobile */}
        {sideOpen && <div className={s.sideBackdrop} onClick={() => setSideOpen(false)} />}

        {/* Sidebar */}
        <aside className={`${s.sidebar} ${sideOpen ? s.sideOpen : ""}`}>
          <div className={s.sideCard}>
            <div className={s.sideHeader}>
              <span className={s.sideTitle}>Courses</span>
              <button className={s.sideClose} onClick={() => setSideOpen(false)}><X size={15} /></button>
            </div>
            <ul className={s.courseList}>
              <li className={`${s.courseItem} ${filterSub === "All" ? s.courseActive : ""}`}
                onClick={() => { setFilterSub("All"); setSideOpen(false); }}>
                <span>All Courses</span>
                <span className={`${s.cnt} ${filterSub === "All" ? s.cntActive : ""}`}>{resources.length}</span>
              </li>
              {Object.entries(SEMESTERS).map(([sem, courses]) => (
                <div key={sem}>
                  <div className={s.semLabel}>{sem}</div>
                  {courses.map(c => (
                    <li key={c.code}
                      className={`${s.courseItem} ${filterSub === c.code ? s.courseActive : ""}`}
                      onClick={() => { setFilterSub(c.code); setSideOpen(false); }}
                      title={c.title}>
                      <span className={s.courseCode}>{c.code}</span>
                      <span className={`${s.cnt} ${filterSub === c.code ? s.cntActive : ""}`}>
                        {countByCode[c.code] || 0}
                      </span>
                    </li>
                  ))}
                </div>
              ))}
            </ul>
          </div>

          {/* Top 5 */}
          {top5.length > 0 && (
            <div className={s.sideCard}>
              <div className={s.sideTitle} style={{marginBottom:10}}>🔥 Top Voted</div>
              <ul className={s.topList}>
                {top5.map((r,i) => (
                  <li key={r.id} className={s.topItem}>
                    <span className={`${s.rank} ${i===0?s.rankGold:""}`}>{i+1}</span>
                    <span className={s.topTitle}>{r.title.slice(0,28)}{r.title.length>28?"…":""}</span>
                    <span className={s.topVotes}>⭐{r.votes}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Feed */}
        <main className={s.feed}>
          {/* Sort tabs */}
          <div className={s.sortTabs}>
            {[["recent","🕐 Recent"],["votes","⭐ Top Voted"],["mine","👤 My Uploads"]].map(([k,l]) => (
              <button key={k} className={`${s.sortTab} ${sort===k?s.sortActive:""}`} onClick={()=>setSort(k)}>{l}</button>
            ))}
          </div>

          {/* Controls */}
          <div className={s.controls}>
            <div className={s.searchWrap}>
              <Search size={15} className={s.searchIcon} />
              <input className={s.searchInput}
                placeholder="Search by title, code, keyword…"
                value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              {searchQ && (
                <button className={s.clearSearch} onClick={() => setSearchQ("")}><X size={14} /></button>
              )}
            </div>
            <div className={s.typeTabs}>
              {TYPES.map(t => (
                <button key={t}
                  className={`${s.typeTab} ${filterType===t?s.typeActive:""}`}
                  onClick={() => setFilterType(t)}>{t}</button>
              ))}
            </div>
            <button className={`btn btn-primary ${s.desktopAdd}`} onClick={() => setShowModal(true)}>
              <Plus size={15} /> Share Resource
            </button>
          </div>

          {/* Result count */}
          {(searchQ || filterSub !== "All" || filterType !== "All") && (
            <div className={s.resultMeta}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {filterSub !== "All" && <span className={s.metaTag}>{filterSub} <button onClick={() => setFilterSub("All")}>×</button></span>}
              {filterType !== "All" && <span className={s.metaTag}>{filterType} <button onClick={() => setFilterType("All")}>×</button></span>}
              {searchQ && <span className={s.metaTag}>"{searchQ}" <button onClick={() => setSearchQ("")}>×</button></span>}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={s.errorBanner}>
              ⚠️ {error}
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">{sort === "mine" ? "📤" : "🔍"}</div>
              <h3>{sort === "mine" ? "No uploads yet" : "No resources found"}</h3>
              <p>{sort === "mine" ? "Share your first resource with your peers!" : "Try different filters or add one yourself!"}</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Share Resource
              </button>
            </div>
          ) : (
            <div className={s.grid}>
              {filtered.map((r, i) => (
                <div key={r.id} style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}>
                  <ResourceCard resource={r} onVote={toggleVote} onSave={toggleSave} onDelete={deleteResource} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <AddResourceModal onClose={() => setShowModal(false)} onSubmit={addResource} />
      )}
    </div>
  );
}
