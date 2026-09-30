import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SpecialistDashboard from "./pages/SpecialistDashboard.jsx";

function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">
      Cargando...
    </div>
  );
}

function RedirectHome() {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireRole role="specialist">
            <SpecialistDashboard />
          </RequireRole>
        }
      />
      <Route path="/" element={<RedirectHome />} />
      <Route path="*" element={<RedirectHome />} />
    </Routes>
  );
}
