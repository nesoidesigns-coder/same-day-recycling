import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import GoogleAnalytics from './components/GoogleAnalytics';
import ReceptionistChat from '@/components/sdr/ReceptionistChat';
// Add page imports here
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminPricing from './pages/AdminPricing';
import AdminControlCenter from './pages/AdminControlCenter';
import AdminAnalytics from './pages/AdminAnalytics';
import CityPage from './pages/CityPage';
import CityRedirect from './pages/CityRedirect';
import { CITIES } from '@/lib/cities';
import AdminJobs from './pages/AdminJobs';
import PartnersDashboard from './pages/PartnersDashboard';
import Subscriptions from './pages/Subscriptions';
import FreeMetalPickup from './pages/FreeMetalPickup';
import About from './pages/About';
import Contact from './pages/Contact';
import ReviewPage from './pages/ReviewPage';
import RealtorLanding from './pages/RealtorLanding';
import RealtorOnePager from './pages/RealtorOnePager';
import RealtorDashboard from './pages/RealtorDashboard';
import Realtors from './pages/Realtors';
import AdminFacebook from './pages/AdminFacebook';
import AdminMarketing from './pages/AdminMarketing';
import RecyclingCenters from './pages/RecyclingCenters';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contractors from './pages/Contractors';
import Coverage from './pages/Coverage';
import PropertyManagers from './pages/PropertyManagers';
import WhiteLabel from './pages/WhiteLabel';
import AdminWhiteLabel from './pages/AdminWhiteLabel';
import Gallery from './pages/Gallery';
import AdminGallery from './pages/AdminGallery';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/city/:slug" element={<CityRedirect />} />
      {CITIES.map((c) => (
        <Route key={c.slug} path={`/junk-removal-${c.slug}`} element={<CityPage slugParam={c.slug} />} />
      ))}
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/free-metal-pickup" element={<FreeMetalPickup />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/realtors" element={<Realtors />} />
      <Route path="/contractors" element={<Contractors />} />
      <Route path="/coverage" element={<Coverage />} />
      <Route path="/property-managers" element={<PropertyManagers />} />
      <Route path="/white-label" element={<WhiteLabel />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/real-estate" element={<RealtorLanding />} />
      <Route path="/realtor-partners" element={<RealtorOnePager />} />
      <Route path="/recycling-centers" element={<RecyclingCenters />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/admin" element={<AdminControlCenter />} />
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/jobs" element={<AdminJobs />} />
        <Route path="/admin/facebook" element={<AdminFacebook />} />
        <Route path="/admin/white-label" element={<AdminWhiteLabel />} />
        <Route path="/admin/gallery" element={<AdminGallery />} />
        <Route path="/admin/marketing" element={<AdminMarketing />} />
        <Route path="/partners" element={<PartnersDashboard />} />
        <Route path="/realtor-dashboard" element={<RealtorDashboard />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <GoogleAnalytics />
          <ReceptionistChat />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App