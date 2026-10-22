import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '../public/States.jsx';
import Button from '../public/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/** Sends signed-out visitors to the login page and remembers where they were going. */
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) return <LoadingState className="min-h-screen" label="Checking your session…" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return children;
}

/** Hides a page from roles that may not use it. (The API enforces this too; this only avoids a dead-end screen.) super_admin always passes. */
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (user.role === 'super_admin' || roles.includes(user.role)) return children;
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-extrabold">No access</h1>
      <p className="mt-2 text-slate-600">Your account does not have permission to open this page.</p>
      <Button to="/admin" className="mt-5">
        Back to dashboard
      </Button>
    </div>
  );
}
