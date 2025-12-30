import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Protected() {
  const { user, loading } = useAuth();

  // While checking token / loading user
  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  // If user is not logged in → send to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists → render the protected route's children
  return <Outlet />;
}
