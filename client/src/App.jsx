import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { LoadingState } from './components/public/States.jsx';
import { SiteProvider } from './context/SiteContext.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import HomePage from './pages/public/HomePage.jsx';

// Every page except the home page loads on demand to keep the first visit fast.
const AboutPage = lazy(() => import('./pages/public/AboutPage.jsx'));
const DoctorsPage = lazy(() => import('./pages/public/DoctorsPage.jsx'));
const DoctorDetailPage = lazy(() => import('./pages/public/DoctorDetailPage.jsx'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage.jsx'));
const ServiceDetailPage = lazy(() => import('./pages/public/ServiceDetailPage.jsx'));
const GalleryPage = lazy(() => import('./pages/public/GalleryPage.jsx'));
const TestimonialsPage = lazy(() => import('./pages/public/TestimonialsPage.jsx'));
const BlogPage = lazy(() => import('./pages/public/BlogPage.jsx'));
const BlogPostPage = lazy(() => import('./pages/public/BlogPostPage.jsx'));
const ContactPage = lazy(() => import('./pages/public/ContactPage.jsx'));
const BookAppointmentPage = lazy(() => import('./pages/public/BookAppointmentPage.jsx'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.jsx'));

// CRM screens are separate chunks: website visitors never download them.
const AdminRoot = lazy(() => import('./layouts/AdminRoot.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const LoginPage = lazy(() => import('./pages/admin/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/admin/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/admin/ResetPasswordPage.jsx'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const AppointmentsPage = lazy(() => import('./pages/admin/AppointmentsPage.jsx'));
const PatientsPage = lazy(() => import('./pages/admin/PatientsPage.jsx'));
const PatientDetailPage = lazy(() => import('./pages/admin/PatientDetailPage.jsx'));
const LeadsPage = lazy(() => import('./pages/admin/LeadsPage.jsx'));
const LeadDetailPage = lazy(() => import('./pages/admin/LeadDetailPage.jsx'));
const FollowUpsPage = lazy(() => import('./pages/admin/FollowUpsPage.jsx'));
const VaccinationsPage = lazy(() => import('./pages/admin/VaccinationsPage.jsx'));
const DoctorsAdminPage = lazy(() => import('./pages/admin/DoctorsAdminPage.jsx'));
const DoctorEditPage = lazy(() => import('./pages/admin/DoctorEditPage.jsx'));
const LocationsAdminPage = lazy(() => import('./pages/admin/LocationsAdminPage.jsx'));
const ServicesAdminPage = lazy(() => import('./pages/admin/ServicesAdminPage.jsx'));
const SpecialtiesAdminPage = lazy(() => import('./pages/admin/SpecialtiesAdminPage.jsx'));
const TestimonialsAdminPage = lazy(() => import('./pages/admin/TestimonialsAdminPage.jsx'));
const GalleryAdminPage = lazy(() => import('./pages/admin/GalleryAdminPage.jsx'));
const BlogAdminPage = lazy(() => import('./pages/admin/BlogAdminPage.jsx'));
const BlogEditorPage = lazy(() => import('./pages/admin/BlogEditorPage.jsx'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.jsx'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage.jsx'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage.jsx'));
const RequireRole = lazy(() => import('./components/admin/RouteGuards.jsx').then((module) => ({ default: module.RequireRole })));

const receptionOnly = ['receptionist'];
const adminOnly = []; // super admin always passes RequireRole

const AdminOnly = ({ children }) => <RequireRole roles={adminOnly}>{children}</RequireRole>;

export default function App() {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen" />}>
      <AppRoutes />
    </Suspense>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="admin" element={<AdminRoot />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="leads" element={<RequireRole roles={receptionOnly}><LeadsPage /></RequireRole>} />
          <Route path="leads/:id" element={<RequireRole roles={receptionOnly}><LeadDetailPage /></RequireRole>} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="vaccinations" element={<VaccinationsPage />} />
          <Route path="doctors" element={<DoctorsAdminPage />} />
          <Route path="doctors/:id" element={<DoctorEditPage />} />
          <Route path="locations" element={<AdminOnly><LocationsAdminPage /></AdminOnly>} />
          <Route path="services" element={<AdminOnly><ServicesAdminPage /></AdminOnly>} />
          <Route path="specialties" element={<AdminOnly><SpecialtiesAdminPage /></AdminOnly>} />
          <Route path="testimonials" element={<AdminOnly><TestimonialsAdminPage /></AdminOnly>} />
          <Route path="gallery" element={<AdminOnly><GalleryAdminPage /></AdminOnly>} />
          <Route path="blog" element={<AdminOnly><BlogAdminPage /></AdminOnly>} />
          <Route path="blog/new" element={<AdminOnly><BlogEditorPage /></AdminOnly>} />
          <Route path="blog/:id" element={<AdminOnly><BlogEditorPage /></AdminOnly>} />
          <Route path="settings" element={<AdminOnly><SettingsPage /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="activity" element={<AdminOnly><ActivityLogPage /></AdminOnly>} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <SiteProvider>
            <PublicRoutes />
          </SiteProvider>
        }
      />
    </Routes>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about-us" element={<AboutPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:slug" element={<DoctorDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />
        <Route path="contact-us" element={<ContactPage />} />
        <Route path="book-appointment" element={<BookAppointmentPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
