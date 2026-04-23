import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Still bootstrapping → show loader (prevents redirect loop)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060810]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

 if (!isAuthenticated || !user) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}

if (requiredRole && user.role !== requiredRole) {
  return <Navigate to="/unauthorized" replace />;
}

  // 4. All good
  return children;
}