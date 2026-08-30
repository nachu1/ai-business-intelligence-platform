import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";

interface Props {
  children: ReactNode;
  roles?: string[];
}

function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated } = useAuth();
  const { user, loading } = useUser();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) return null;

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;