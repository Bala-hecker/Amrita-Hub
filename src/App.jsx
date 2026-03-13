// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider }    from "./context/AuthContext";
import ProtectedRoute      from "./components/ProtectedRoute";
import Navbar              from "./components/Navbar";
import Login               from "./pages/Login";
import Register            from "./pages/Register";
import Home                from "./pages/Home";
import Saved               from "./pages/Saved";
import Trending            from "./pages/Trending";
import Curriculum          from "./pages/Curriculum";
import Profile             from "./pages/Profile";
import "./styles/global.css";

function Layout() {
  return <>
    <Navbar />
    <Outlet />
  </>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/"           element={<Home />} />
            <Route path="/saved"      element={<Saved />} />
            <Route path="/trending"   element={<Trending />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
