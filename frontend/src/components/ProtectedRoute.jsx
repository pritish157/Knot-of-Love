import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PageLoader from "./PageLoader";

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, bootstrapping, user } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Role guard — redirect non-admins away from admin routes
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
