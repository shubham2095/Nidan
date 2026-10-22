import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <SiteProvider>
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
    </SiteProvider>
  );
}
