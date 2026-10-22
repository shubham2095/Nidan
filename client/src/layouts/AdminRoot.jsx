import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LoadingState } from '../components/public/States.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

/** Wraps everything under /admin: session handling, toasts, and "never index this". */
export default function AdminRoot() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Helmet>
          <title>Nidan CRM</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Suspense fallback={<LoadingState className="min-h-screen" />}>
          <Outlet />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
