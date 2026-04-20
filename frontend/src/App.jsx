import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PageLoader from "./components/PageLoader";
import ScrollToTop from "./components/ScrollToTop";
import { ProfilesProvider } from "./context/ProfilesContext";

const HomePage           = lazy(() => import("./pages/HomePage"));
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const RegisterPage       = lazy(() => import("./pages/RegisterPage"));
const DashboardPage      = lazy(() => import("./pages/DashboardPage"));
const ProfilesPage       = lazy(() => import("./pages/ProfilesPage"));
const VerifyOtpPage      = lazy(() => import("./pages/VerifyOtpPage"));
const OnboardingPage     = lazy(() => import("./pages/OnboardingPage"));
const KycPage            = lazy(() => import("./pages/KycPage"));
const ChatPage           = lazy(() => import("./pages/ChatPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const NotFoundPage       = lazy(() => import("./pages/NotFoundPage"));
const StaticPage         = lazy(() => import("./pages/StaticPage"));

// Admin sub-pages (separate lazy bundle)
const AdminOverview     = lazy(() => import("./pages/admin/AdminOverview"));
const AdminMembers      = lazy(() => import("./pages/admin/AdminMembers"));
const AdminKYC          = lazy(() => import("./pages/admin/AdminKYC"));
const AdminReports      = lazy(() => import("./pages/admin/AdminReports"));
const AdminActivityLog  = lazy(() => import("./pages/admin/AdminActivityLog"));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public site shell ──────────────────────────────────────────── */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* ── Auth pages ─────────────────────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-otp"      element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* ── Static pages (footer links) ────────────────────────────────── */}
          <Route path="/privacy" element={<StaticPage title="Privacy Policy" slug="privacy" />} />
          <Route path="/terms"   element={<StaticPage title="Terms of Use"   slug="terms" />} />
          <Route path="/contact" element={<StaticPage title="Contact Us"     slug="contact" />} />

          {/* ── Admin panel (dedicated layout, Admin-role only) ────────────── */}
          <Route
            element={
              <ProtectedRoute requireRole="Admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin"             element={<AdminOverview />} />
            <Route path="/admin/members"     element={<AdminMembers />} />
            <Route path="/admin/kyc"         element={<AdminKYC />} />
            <Route path="/admin/reports"     element={<AdminReports />} />
            <Route path="/admin/activity"    element={<AdminActivityLog />} />
          </Route>

          {/* ── Protected user dashboard shell ─────────────────────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <ProfilesProvider>
                  <DashboardLayout />
                </ProfilesProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/profiles"   element={<ProfilesPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/kyc"        element={<KycPage />} />
            <Route path="/chat"       element={<ChatPage />} />
          </Route>

          {/* ── 404 ────────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
