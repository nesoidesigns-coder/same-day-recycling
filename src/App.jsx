import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import NotFoundPage from './lib/NotFoundPage';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import GoogleAnalytics from './components/GoogleAnalytics';
import ReceptionistChat from '@/components/sdr/ReceptionistChat';
import SearchIndexing from '@/components/seo/SearchIndexing';
// Add page imports here
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminPricing from './pages/AdminPricing';
import AdminOverview from './pages/AdminOverview';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDispatch from './pages/AdminDispatch';
import AdminLeads from './pages/AdminLeads';
import AdminAssignments from './pages/AdminAssignments';
import AdminPartners from './pages/AdminPartners';
import AdminPayouts from './pages/AdminPayouts';
import AdminCities from './pages/AdminCities';
import AdminReviews from './pages/AdminReviews';
import AdminKeywords from './pages/AdminKeywords';
import AdminSystem from './pages/AdminSystem';
import AdminRoutes from './pages/AdminRoutes';
import AdminAnalytics from './pages/AdminAnalytics';
import RecyclingDirectory from './pages/RecyclingDirectory';
import ProviderDetail from './pages/ProviderDetail';
import RecyclingAssistant from './pages/RecyclingAssistant';
import AdminDirectory from './pages/AdminDirectory';
import PartnersDashboard from './pages/PartnersDashboard';
import PartnerRegister from './pages/PartnerRegister';
import ContractorOnboarding from './pages/ContractorOnboarding';
import AdminApplications from './pages/AdminApplications';
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
import ProvincePage from './pages/ProvincePage';
import PropertyManagers from './pages/PropertyManagers';
import WhiteLabel from './pages/WhiteLabel';
import AdminWhiteLabel from './pages/AdminWhiteLabel';
import WhiteLabelPay from './pages/WhiteLabelPay';
import SoftwareSales from './pages/SoftwareSales';
import SoftwarePay from './pages/SoftwarePay';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminSoftware from './pages/AdminSoftware';
import SoftwareOnboarding from './pages/SoftwareOnboarding';
import LicenseAgreement from './pages/LicenseAgreement';
import Gallery from './pages/Gallery';
import FurnitureRemoval from './pages/FurnitureRemoval';
import ApplianceRemoval from './pages/ApplianceRemoval';
import ElectronicsRecycling from './pages/ElectronicsRecycling';
import CommercialRecycling from './pages/CommercialRecycling';
import SameDayPickup from './pages/SameDayPickup';
import AdminSearchIntelligence from './pages/AdminSearchIntelligence';
import ExploreServices from './pages/ExploreServices';
import RequestService from './pages/RequestService';
import RequestStatus from './pages/RequestStatus';
import AdminNational from './pages/AdminNational';
import ServiceFinder from './pages/ServiceFinder';
import AIBookingCenter from './pages/AIBookingCenter';
import CityPage from './pages/CityPage';
import Pricing from './pages/Pricing';
import AdminGallery from './pages/AdminGallery';
import ProtectedRoute from '@/components/ProtectedRoute';
import CityRedirect from '@/components/CityRedirect';

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
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/free-metal-pickup" element={<FreeMetalPickup />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/license-agreement" element={<LicenseAgreement />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/realtors" element={<Realtors />} />
      <Route path="/contractors" element={<Contractors />} />
      <Route path="/contractor-onboarding" element={<ContractorOnboarding />} />
      <Route path="/coverage" element={<Coverage />} />
      <Route path="/region/:code" element={<ProvincePage />} />
      <Route path="/property-managers" element={<PropertyManagers />} />
      <Route path="/white-label" element={<WhiteLabel />} />
      <Route path="/white-label-pay" element={<WhiteLabelPay />} />
      <Route path="/software" element={<SoftwareSales />} />
      <Route path="/software-pay" element={<SoftwarePay />} />
      <Route path="/software/start" element={<SoftwareOnboarding />} />
      <Route path="/furniture-removal" element={<FurnitureRemoval />} />
      <Route path="/appliance-removal" element={<ApplianceRemoval />} />
      <Route path="/electronics-recycling" element={<ElectronicsRecycling />} />
      <Route path="/commercial-recycling" element={<CommercialRecycling />} />
      <Route path="/same-day-pickup" element={<SameDayPickup />} />
      <Route path="/services" element={<ExploreServices />} />
      <Route path="/service-finder" element={<ServiceFinder />} />
      <Route path="/request-service" element={<RequestService />} />
      <Route path="/request-status" element={<RequestStatus />} />
      <Route path="/ai-booking" element={<AIBookingCenter />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/recycling" element={<RecyclingDirectory />} />
      <Route path="/recycling-assistant" element={<RecyclingAssistant />} />
      <Route path="/provider/:id" element={<ProviderDetail />} />
      <Route path="/real-estate" element={<RealtorLanding />} />
      <Route path="/realtor-partners" element={<RealtorOnePager />} />
      <Route path="/recycling-centers" element={<RecyclingCenters />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/jobs" element={<AdminDispatch />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
          <Route path="/admin/partners" element={<AdminPartners />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/payouts" element={<AdminPayouts />} />
          <Route path="/admin/cities" element={<AdminCities />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/keywords" element={<AdminKeywords />} />
          <Route path="/admin/system" element={<AdminSystem />} />
          <Route path="/admin/search-intelligence" element={<AdminSearchIntelligence />} />
          <Route path="/admin/routes" element={<AdminRoutes />} />
        </Route>
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/directory" element={<AdminDirectory />} />
        <Route path="/admin/facebook" element={<AdminFacebook />} />
        <Route path="/admin/white-label" element={<AdminWhiteLabel />} />
        <Route path="/admin/gallery" element={<AdminGallery />} />
        <Route path="/admin/marketing" element={<AdminMarketing />} />
        <Route path="/admin/software" element={<AdminSoftware />} />
        <Route path="/admin/national" element={<AdminNational />} />
        <Route path="/company" element={<CompanyDashboard />} />
        <Route path="/partners" element={<PartnersDashboard />} />
        <Route path="/partner-register" element={<PartnerRegister />} />
        <Route path="/realtor-dashboard" element={<RealtorDashboard />} />
      </Route>
      <Route path="/city/:cityName" element={<CityRedirect />} />
      <Route path="/:pageSlug" element={<CityPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <SearchIndexing />
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