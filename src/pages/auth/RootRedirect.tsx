import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardPathForRole } from '../../auth/rolePaths';
import { LandingPage } from '../LandingPage';

export function RootRedirect() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  if (user) {
    if (user.mustChangePassword) {
      return <Navigate to="/account/setup-password" replace />;
    }
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <LandingPage />;
}
