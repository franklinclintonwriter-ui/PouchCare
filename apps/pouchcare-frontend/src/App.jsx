import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import PartnersPage from "./pages/PartnersPage";
import SupportCenter from "./pages/SupportCenter";
import Changelog from "./pages/Changelog";
import ApiReference from "./pages/ApiReference";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import { AuthProvider } from "./portal/shared/auth/AuthContext";
import { AdminAuthProvider } from "./portal/admin/auth/AdminAuthContext";
import RequireAdminAuth from "./portal/admin/auth/RequireAdminAuth";
import AdminLayout from "./portal/admin/layout/AdminLayout";
import AdminDashboardPage from "./portal/admin/pages/Dashboard";
import AdminCustomersPage from "./portal/admin/pages/Customers";
import InstallationsPage from "./portal/admin/pages/Installations";
import CompaniesPage from "./portal/admin/pages/Companies";
import ProjectsPage from "./portal/admin/pages/Projects";
import TemplatesPage from "./portal/admin/pages/Templates";
import PagesPage from "./portal/admin/pages/Pages";
import MediaPage from "./portal/admin/pages/Media";
import SeoPage from "./portal/admin/pages/Seo";
import LeadsPage from "./portal/admin/pages/Leads";
import TeamPage from "./portal/admin/pages/Team";
import BillingPage from "./portal/admin/pages/Billing";
import SettingsPage from "./portal/admin/pages/Settings";
import SystemStatusPage from "./portal/admin/pages/SystemStatus";
import EmailTemplatesPage from "./portal/admin/pages/EmailTemplates";
import AnalyticsPage from "./portal/admin/pages/Analytics";
import BlockLibraryPage from "./portal/admin/pages/BlockLibrary";
import PatternLibraryPage from "./portal/admin/pages/PatternLibrary";
import { CustomerAuthProvider } from "./portal/customer/auth/CustomerAuthContext";
import RequireCustomerAuth from "./portal/customer/auth/RequireCustomerAuth";
import CustomerLayout from "./portal/customer/layout/CustomerLayout";
import CustomerDashboardPage from "./portal/customer/pages/Dashboard";
import CustomerWebsitesPage from "./portal/customer/pages/Websites";
import CustomerBillingPage from "./portal/customer/pages/Billing";
import CustomerProfilePage from "./portal/customer/pages/Profile";
import CustomerSubscriptionsPage from "./portal/customer/pages/Subscriptions";
import CustomerPluginsPage from "./portal/customer/pages/Plugins";
import CustomerSettingsPage from "./portal/customer/pages/Settings";
import CustomerSupportPage from "./portal/customer/pages/Support";
import CustomerSitesPage from "./portal/customer/pages/Sites";
import CustomerLicensesPage from "./portal/customer/pages/Licenses";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import VerifyEmail from "./pages/customer/VerifyEmail";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/customer/ResetPassword";
import { CustomerPortalProvider } from "./portal/customer/state/CustomerPortalContext";
import { AdminPortalProvider } from "./portal/admin/state/AdminPortalContext";
import { LicenseProvider } from "./portal/shared/state/LicenseContext";
import MarketplacePage from "./portal/admin/pages/Marketplace";
import { isAdminSubdomainHost } from "./config/runtime";

const adminChildRoutes = [
  { index: true, element: <AdminDashboardPage /> },
  { path: "customers", element: <AdminCustomersPage /> },
  { path: "customers/:customerId", element: <AdminCustomersPage /> },
  { path: "installations", element: <InstallationsPage /> },
  { path: "companies", element: <CompaniesPage /> },
  { path: "companies/:companyId", element: <CompaniesPage /> },
  { path: "projects", element: <ProjectsPage /> },
  { path: "projects/:projectId", element: <ProjectsPage /> },
  { path: "templates", element: <TemplatesPage /> },
  { path: "templates/:templateId", element: <TemplatesPage /> },
  { path: "pages", element: <PagesPage /> },
  { path: "pages/:pageId", element: <PagesPage /> },
  { path: "media", element: <MediaPage /> },
  { path: "blocks", element: <BlockLibraryPage /> },
  { path: "patterns", element: <PatternLibraryPage /> },
  { path: "seo", element: <SeoPage /> },
  { path: "leads", element: <LeadsPage /> },
  { path: "team", element: <TeamPage /> },
  { path: "billing", element: <BillingPage /> },
  { path: "settings", element: <SettingsPage /> },
  { path: "emails", element: <EmailTemplatesPage /> },
  { path: "analytics", element: <AnalyticsPage /> },
  { path: "marketplace", element: <MarketplacePage /> },
  { path: "system", element: <SystemStatusPage /> },
];

function renderAdminChildRoutes() {
  return adminChildRoutes.map((route) => {
    if (route.index) {
      return <Route key="admin-index" index element={route.element} />;
    }
    return <Route key={route.path} path={route.path} element={route.element} />;
  });
}

function AdminRoutesOnly() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<Navigate to="/register" replace />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route
        path="/*"
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        {renderAdminChildRoutes()}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MixedMainRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/register" element={<Signup />} />
      <Route
        path="/admin/*"
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        {renderAdminChildRoutes()}
      </Route>

      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      <Route path="/customer/verify-email" element={<VerifyEmail />} />
      <Route path="/customer/forgot-password" element={<ForgotPassword />} />
      <Route path="/customer/reset-password" element={<ResetPassword />} />
      <Route
        path="/customer/*"
        element={
          <RequireCustomerAuth>
            <CustomerLayout />
          </RequireCustomerAuth>
        }
      >
        <Route index element={<CustomerDashboardPage />} />
        <Route path="websites" element={<CustomerWebsitesPage />} />
        <Route path="billing" element={<CustomerBillingPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="subscriptions" element={<CustomerSubscriptionsPage />} />
        <Route path="plugins" element={<CustomerPluginsPage />} />
        <Route path="settings" element={<CustomerSettingsPage />} />
        <Route path="support" element={<CustomerSupportPage />} />
        <Route path="sites" element={<CustomerSitesPage />} />
        <Route path="licenses" element={<CustomerLicensesPage />} />
        <Route path="websites/:websiteId" element={<CustomerWebsitesPage />} />
        <Route path="subscriptions/:subscriptionId" element={<CustomerSubscriptionsPage />} />
        <Route path="plugins/:pluginId" element={<CustomerPluginsPage />} />
        <Route path="support/:ticketId" element={<CustomerSupportPage />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col font-body">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/partners" element={<PartnersPage />} />
                <Route path="/support" element={<SupportCenter />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route path="/api" element={<ApiReference />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/login" element={<Navigate to="/customer/login" replace />} />
                <Route path="/signup" element={<Navigate to="/customer/register" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  const adminMode = isAdminSubdomainHost();

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <LicenseProvider>
          <AdminPortalProvider>
            <CustomerAuthProvider>
              <CustomerPortalProvider>
                {adminMode ? <AdminRoutesOnly /> : <MixedMainRoutes />}
              </CustomerPortalProvider>
            </CustomerAuthProvider>
          </AdminPortalProvider>
        </LicenseProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
