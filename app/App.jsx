import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './index.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import MobileBottomNav from '@/components/MobileBottomNav';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { AdminThemeProvider } from '@/contexts/AdminThemeContext';
import CookieConsent from '@/components/common/CookieConsent';
import LoadingScreen from '@/components/common/LoadingScreen';

// Pages - lazy loaded
const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MyOrdersPage = lazy(() => import('@/pages/MyOrdersPage'));
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsConditionsPage = lazy(() => import('@/pages/TermsConditionsPage'));
const ShippingPage = lazy(() => import('@/pages/ShippingPage'));
const ReturnsPage = lazy(() => import('@/pages/ReturnsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const MarketingHubPage = lazy(() => import('@/pages/admin/MarketingHubPage'));
const SalesHubPage = lazy(() => import('@/pages/admin/SalesHubPage'));
const OperationsHub = lazy(() => import('@/pages/admin/OperationsHub'));
const ProfitabilityHub = lazy(() => import('@/pages/admin/ProfitabilityHub'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500 font-medium">Loading PetYupp...</span>
    </div>
  </div>
);

function App() {
  const [loading, setLoading] = React.useState(() => !sessionStorage.getItem('petyupp_loaded'));

  const handleLoadDone = () => {
    sessionStorage.setItem('petyupp_loaded', '1');
    setLoading(false);
  };
  return (
    <>
      {loading && <LoadingScreen onDone={handleLoadDone} />}
      <ThemeProvider>
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsConditionsPage />} />
              <Route path="/shipping" element={<ShippingPage />} />
              <Route path="/returns" element={<ReturnsPage />} />
                            <Route path="/admin/*" element={
                <AdminAuthProvider>
              <AdminThemeProvider>
                  <Routes>
                    <Route path="/" element={<AdminLoginPage />} />
                    <Route path="/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/products" element={<AdminProductsPage />} />
                    <Route path="/orders" element={<AdminOrdersPage />} />
                    <Route path="/marketing" element={<MarketingHubPage />} />
                    <Route path="/sales" element={<SalesHubPage />} />
                    <Route path="/operations" element={<OperationsHub />} />
                    <Route path="/profitability" element={<ProfitabilityHub />} />
                  </Routes>
              </AdminThemeProvider>
                </AdminAuthProvider>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          toastClassName="!rounded-xl !font-medium"
          progressClassName="!bg-[#06B6D4]"
        />
      <MobileBottomNav />
      </div>
    </Router>
            </ThemeProvider>
      <CookieConsent />
    </>
  );
}

export default App;
