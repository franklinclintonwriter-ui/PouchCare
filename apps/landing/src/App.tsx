import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/portal/ProtectedRoute";
import { GuestOnly } from "@/components/portal/GuestOnly";
import { PortalSessionSync } from "@/components/portal/PortalSessionSync";
import { HostingLayout } from "@/components/dashboard/HostingLayout";
import { paths } from "@/routes/paths";

const Home = lazy(() => import("@/pages/Home"));
const Services = lazy(() => import("@/pages/Services"));
const ServicesHostingPage = lazy(() => import("@/pages/ServicesHostingPage"));
const Backlinks = lazy(() => import("@/pages/Backlinks"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

const LoginPage = lazy(() => import("@/pages/portal/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/portal/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/portal/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/portal/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/portal/ResetPasswordPage"));

const DashboardOverviewPage = lazy(
  () => import("@/pages/dashboard/DashboardOverviewPage"),
);
const OrdersPage = lazy(() => import("@/pages/dashboard/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/dashboard/OrderDetailPage"));
const WalletPage = lazy(() => import("@/pages/dashboard/WalletPage"));
const ServicesCatalogPage = lazy(() => import("@/pages/dashboard/ServicesPage"));
const CartPage = lazy(() => import("@/pages/dashboard/CartPage"));
const ReferralsPage = lazy(() => import("@/pages/dashboard/ReferralsPage"));
const BillingPage = lazy(() => import("@/pages/dashboard/BillingPage"));
const ProfilePage = lazy(() => import("@/pages/dashboard/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const SupportPage = lazy(() => import("@/pages/dashboard/SupportPage"));
const SupportTicketPage = lazy(
  () => import("@/pages/dashboard/SupportTicketPage"),
);
const HostingOverviewPage = lazy(
  () => import("@/pages/dashboard/HostingOverviewPage"),
);
const HostingRegisterPage = lazy(
  () => import("@/pages/dashboard/HostingRegisterPage"),
);
const HostingDomainDetailPage = lazy(
  () => import("@/pages/dashboard/HostingDomainDetailPage"),
);
const WebToApkPage = lazy(() => import("@/pages/dashboard/WebToApkPage"));
const InvoicesPage = lazy(() => import("@/pages/dashboard/InvoicesPage"));
const InvoiceDetailPage = lazy(
  () => import("@/pages/dashboard/InvoiceDetailPage"),
);
const WebsitesPage = lazy(() => import("@/pages/dashboard/WebsitesPage"));
const WebsiteDetailPage = lazy(
  () => import("@/pages/dashboard/WebsiteDetailPage"),
);
const ServicesWebToApkPage = lazy(() => import("@/pages/ServicesWebToApkPage"));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PortalSessionSync />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/my-accounts" element={<AccountLayout />}>
            <Route
              path="login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="register"
              element={
                <GuestOnly>
                  <RegisterPage />
                </GuestOnly>
              }
            />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route index element={<Navigate to={paths.login} replace />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="hosting" element={<HostingLayout />}>
              <Route index element={<HostingOverviewPage />} />
              <Route path="register" element={<HostingRegisterPage />} />
              <Route path=":domainId" element={<HostingDomainDetailPage />} />
            </Route>
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="services" element={<ServicesCatalogPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="support/:ticketId" element={<SupportTicketPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="web-to-apk" element={<WebToApkPage />} />
            <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="websites/:siteId" element={<WebsiteDetailPage />} />
            <Route path="websites" element={<WebsitesPage />} />
          </Route>

          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services/hosting" element={<ServicesHostingPage />} />
            <Route path="/services/web-to-apk" element={<ServicesWebToApkPage />} />
            <Route path="/services" element={<Services />} />
            <Route path="/backlinks" element={<Backlinks />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
