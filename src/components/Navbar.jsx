// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import s from "./Navbar.module.css";

const LINKS = [
  { to: "/",           label: "Home",       icon: "🏠" },
  { to: "/search",     label: "Search",     icon: "🔍" },
  { to: "/saved",      label: "Saved",      icon: "🔖" },
  { to: "/trending",   label: "Top Voted",  icon: "🏆" },
  { to: "/curriculum", label: "Curriculum", icon: "📚" },
  { to: "/requests",   label: "Requests",   icon: "🙋‍♂️" },
];

export default function Navbar() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === "light" ? "dark" : "light"));
  };

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login");
  }

  const initials = (profile?.name || user?.displayName || "?")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const firstName = profile?.name?.split(" ")[0] || "Student";

  return (
    <nav className={s.nav}>
      <div className={s.inner}>

        {/* Brand */}
        <Link to="/" className={s.brand} onClick={() => setOpen(false)}>
          <span className={s.brandA}>Amrita</span>
          <span className={s.brandH}>Hub</span>
        </Link>

        {/* Desktop links */}
        <div className={s.links}>
          {LINKS.map(l => (
            <NavLink
              key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) => `${s.link} ${isActive ? s.active : ""}`}
            >
              <span className={s.linkIcon}>{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className={s.right}>
          <button className={s.logoutBtn} onClick={toggleTheme} title={theme === "light" ? "Dark Mode" : "Light Mode"} style={{ marginRight: "4px" }}>
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          {user ? (
            <>
              <Link to="/profile" className={s.userChip} onClick={() => setOpen(false)}>
                <div className={s.avatar}>{initials}</div>
                <div className={s.userInfo}>
                  <span className={s.userName}>{firstName}</span>
                  <span className={s.userDept}>{profile?.year || "CSE"}</span>
                </div>
              </Link>
              <button className={s.logoutBtn} onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ marginRight: "10px" }}>
              Login
            </Link>
          )}
          <button className={s.burger} onClick={() => setOpen(o => !o)} aria-label="Menu">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className={s.backdrop} onClick={() => setOpen(false)} />
          <div className={s.drawer}>
            {user ? (
              <>
                <Link to="/profile" className={s.drawerUser} onClick={() => setOpen(false)}>
                  <div className={s.drawerAvatar}>{initials}</div>
                  <div>
                    <div className={s.drawerName}>{profile?.name || "Student"}</div>
                    <div className={s.drawerSub}>{profile?.email || ""}</div>
                  </div>
                </Link>
                <div className={s.drawerLinks}>
                  {LINKS.map(l => (
                    <NavLink
                      key={l.to} to={l.to} end={l.to === "/"}
                      className={({ isActive }) => `${s.drawerLink} ${isActive ? s.drawerActive : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <span>{l.icon}</span> {l.label}
                    </NavLink>
                  ))}
                  <button className={s.drawerLink} style={{ background: "none", border: "none", width: "100%", textAlign: "left" }} onClick={() => { toggleTheme(); setOpen(false); }}>
                    <span>{theme === "light" ? "🌙" : "☀️"}</span> {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </button>
                </div>
                <button className={s.drawerLogout} onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <div className={s.drawerLinks} style={{ marginTop: "20px" }}>
                  {LINKS.map(l => (
                    <NavLink
                      key={l.to} to={l.to} end={l.to === "/"}
                      className={({ isActive }) => `${s.drawerLink} ${isActive ? s.drawerActive : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      <span>{l.icon}</span> {l.label}
                    </NavLink>
                  ))}
                  <button className={s.drawerLink} style={{ background: "none", border: "none", width: "100%", textAlign: "left" }} onClick={() => { toggleTheme(); setOpen(false); }}>
                    <span>{theme === "light" ? "🌙" : "☀️"}</span> {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </button>
                </div>
                <Link to="/login" className="btn btn-primary btn-block" style={{ margin: "20px 15px", width: "calc(100% - 30px)" }} onClick={() => setOpen(false)}>
                  Login
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
