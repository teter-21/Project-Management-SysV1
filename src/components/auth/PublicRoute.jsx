import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

function PublicRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading" role="status">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
