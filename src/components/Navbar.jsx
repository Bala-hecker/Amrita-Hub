// src/components/Navbar.jsx
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import s from "./Navbar.module.css";

const LINKS = [
  { to: "/",           label: "Home",       icon: "🏠" },
  { to: "/saved",      label: "Saved",      icon: "🔖" },
  { to: "/trending",   label: "Top Voted",  icon: "🏆" },
  { to: "/curriculum", label: "Curriculum", icon: "📚" },
];

export default function Navbar() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
            </div>
            <button className={s.drawerLogout} onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
