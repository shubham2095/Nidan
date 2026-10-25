import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from '../components/public/AnnouncementBar.jsx';
import FloatingActions from '../components/public/FloatingActions.jsx';
import Footer from '../components/public/Footer.jsx';
import Header from '../components/public/Header.jsx';
import ScrollProgress from '../components/public/ScrollProgress.jsx';
import { LoadingState } from '../components/public/States.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <ScrollProgress />
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        {/* keyed by address, so every page change starts with a soft fade */}
        <div key={pathname} className="page-in">
          {/* a full-screen height keeps the footer out of sight while a page loads, so it does not jump when the page appears */}
          <Suspense fallback={<LoadingState className="min-h-screen" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
