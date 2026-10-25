import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import NotFoundPage from './lib/NotFoundPage';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { appParams } from '@/lib/app-params';
import ScrollToTop from './components/ScrollToTop';
import GoogleAnalytics from './components/GoogleAnalytics';
import ReceptionistChat from '@/components/sdr/ReceptionistChat';
import SearchIndexing from '@/components/seo/SearchIndexing';
// Add page imports here.
// Route-level code splitting: only the home page (LCP target) and auth pages
// load upfront; every other page is fetched on demand.
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const lazyPage = (loader) => lazy(loader);
const Privacy = lazyPage(() => import('./pages/Privacy'));
const Terms = lazyPage(() => import('./pages/Terms'));
const AdminPricing = lazyPage(() => import('./pages/AdminPricing'));
const AdminOverview = lazyPage(() => import('./pages/AdminOverview'));
const AdminLayout = lazyPage(() => import('@/components/admin/AdminLayout'));
const AdminDispatch = lazyPage(() => import('./pages/AdminDispatch'));
const AdminLeads = lazyPage(() => import('./pages/AdminLeads'));
const AdminPipeline = lazyPage(() => import('./pages/AdminPipeline'));
const AdminGbpPipeline = lazyPage(() => import('./pages/AdminGbpPipeline'));
const AdminAssignments = lazyPage(() => import('./pages/AdminAssignments'));
const AdminPartners = lazyPage(() => import('./pages/AdminPartners'));
const AdminPayouts = lazyPage(() => import('./pages/AdminPayouts'));
const AdminCities = lazyPage(() => import('./pages/AdminCities'));
const AdminReviews = lazyPage(() => import('./pages/AdminReviews'));
const AdminKeywords = lazyPage(() => import('./pages/AdminKeywords'));
const AdminSystem = lazyPage(() => import('./pages/AdminSystem'));
const AdminRoutes = lazyPage(() => import('./pages/AdminRoutes'));
const AdminAnalytics = lazyPage(() => import('./pages/AdminAnalytics'));
const RecyclingDirectory = lazyPage(() => import('./pages/RecyclingDirectory'));
const ProviderDetail = lazyPage(() => import('./pages/ProviderDetail'));
const RecyclingAssistant = lazyPage(() => import('./pages/RecyclingAssistant'));
const AdminDirectory = lazyPage(() => import('./pages/AdminDirectory'));
const PartnersDashboard = lazyPage(() => import('./pages/PartnersDashboard'));
const PartnerRegister = lazyPage(() => import('./pages/PartnerRegister'));
const ContractorOnboarding = lazyPage(() => import('./pages/ContractorOnboarding'));
const AdminApplications = lazyPage(() => import('./pages/AdminApplications'));
const Subscriptions = lazyPage(() => import('./pages/Subscriptions'));
const FreeMetalPickup = lazyPage(() => import('./pages/FreeMetalPickup'));
const About = lazyPage(() => import('./pages/About'));
const Contact = lazyPage(() => import('./pages/Contact'));
const ReviewPage = lazyPage(() => import('./pages/ReviewPage'));
const RealtorLanding = lazyPage(() => import('./pages/RealtorLanding'));
const RealtorOnePager = lazyPage(() => import('./pages/RealtorOnePager'));
const RealtorDashboard = lazyPage(() => import('./pages/RealtorDashboard'));
const Realtors = lazyPage(() => import('./pages/Realtors'));
const AdminFacebook = lazyPage(() => import('./pages/AdminFacebook'));
const AdminMarketing = lazyPage(() => import('./pages/AdminMarketing'));
const AdminMarketingCommand = lazyPage(() => import('./pages/AdminMarketingCommand'));
const RecyclingCenters = lazyPage(() => import('./pages/RecyclingCenters'));
const Blog = lazyPage(() => import('./pages/Blog'));
const BlogPost = lazyPage(() => import('./pages/BlogPost'));
const Contractors = lazyPage(() => import('./pages/Contractors'));
const Coverage = lazyPage(() => import('./pages/Coverage'));
const ProvincePage = lazyPage(() => import('./pages/ProvincePage'));
const PropertyManagers = lazyPage(() => import('./pages/PropertyManagers'));
const WhiteLabel = lazyPage(() => import('./pages/WhiteLabel'));
const AdminWhiteLabel = lazyPage(() => import('./pages/AdminWhiteLabel'));
const WhiteLabelPay = lazyPage(() => import('./pages/WhiteLabelPay'));
const SoftwareSales = lazyPage(() => import('./pages/SoftwareSales'));
const SoftwarePay = lazyPage(() => import('./pages/SoftwarePay'));
const MembershipPay = lazyPage(() => import('./pages/MembershipPay'));
const FinanceDashboard = lazyPage(() => import('./pages/FinanceDashboard'));
const CompanyDashboard = lazyPage(() => import('./pages/CompanyDashboard'));
const AdminSoftware = lazyPage(() => import('./pages/AdminSoftware'));
const SoftwareOnboarding = lazyPage(() => import('./pages/SoftwareOnboarding'));
const LicenseAgreement = lazyPage(() => import('./pages/LicenseAgreement'));
const Gallery = lazyPage(() => import('./pages/Gallery'));
const FurnitureRemoval = lazyPage(() => import('./pages/FurnitureRemoval'));
const ApplianceRemoval = lazyPage(() => import('./pages/ApplianceRemoval'));
const ElectronicsRecycling = lazyPage(() => import('./pages/ElectronicsRecycling'));
const CommercialRecycling = lazyPage(() => import('./pages/CommercialRecycling'));
const SameDayPickup = lazyPage(() => import('./pages/SameDayPickup'));
const AdminSearchIntelligence = lazyPage(() => import('./pages/AdminSearchIntelligence'));
const AdminSearchAuthority = lazyPage(() => import('./pages/AdminSearchAuthority'));
const AdminIntelligence = lazyPage(() => import('./pages/AdminIntelligence'));
const AdminBusinessMaster = lazyPage(() => import('./pages/AdminBusinessMaster'));
const AdminGrowth = lazyPage(() => import('./pages/AdminGrowth'));
const AdminGrowthEngine = lazyPage(() => import('./pages/AdminGrowthEngine'));
const AdminGrowthCommand = lazyPage(() => import('./pages/AdminGrowthCommand'));
const AdminImprovements = lazyPage(() => import('./pages/AdminImprovements'));
const AdminSeoCommand = lazyPage(() => import('./pages/AdminSeoCommand'));
const AdminSeoAction = lazyPage(() => import('./pages/AdminSeoAction'));
const AdminDemand = lazyPage(() => import('./pages/AdminDemand'));
const AdminDemandObservatory = lazyPage(() => import('./pages/AdminDemandObservatory'));
const DemandPage = lazyPage(() => import('./pages/DemandPage'));
const LiveCentre = lazyPage(() => import('./pages/LiveCentre'));
const ExploreServices = lazyPage(() => import('./pages/ExploreServices'));
const RequestService = lazyPage(() => import('./pages/RequestService'));
const RequestStatus = lazyPage(() => import('./pages/RequestStatus'));
const AdminNational = lazyPage(() => import('./pages/AdminNational'));
const ServiceFinder = lazyPage(() => import('./pages/ServiceFinder'));
const AIBookingCenter = lazyPage(() => import('./pages/AIBookingCenter'));
const CityPage = lazyPage(() => import('./pages/CityPage'));
const Pricing = lazyPage(() => import('./pages/Pricing'));
const AdminGallery = lazyPage(() => import('./pages/AdminGallery'));
const AdminRevenue = lazyPage(() => import('./pages/AdminRevenue'));
const AdminConversion = lazyPage(() => import('./pages/AdminConversion'));
const AdminAcquisition = lazyPage(() => import('./pages/AdminAcquisition'));
const AdminContractorOps = lazyPage(() => import('./pages/AdminContractorOps'));
const AdminFranchiseReview = lazyPage(() => import('./pages/AdminFranchiseReview'));
const AdminContractorAcquisition = lazyPage(() => import('./pages/AdminContractorAcquisition'));
const MembershipCompare = lazyPage(() => import('./pages/MembershipCompare'));
const AdminAgreements = lazyPage(() => import('./pages/AdminAgreements'));
const AdminSalesIntelligence = lazyPage(() => import('./pages/AdminSalesIntelligence'));
const AdminDisputes = lazyPage(() => import('./pages/AdminDisputes'));
const AdminReputation = lazyPage(() => import('./pages/AdminReputation'));
const AdminSms = lazyPage(() => import('./pages/AdminSms'));
const ChangeOrderRespond = lazyPage(() => import('./pages/ChangeOrderRespond'));
const Community = lazyPage(() => import('./pages/Community'));
const CommunityMemberProfile = lazyPage(() => import('./pages/CommunityMemberProfile'));
const AdminCommunity = lazyPage(() => import('./pages/AdminCommunity'));
const AdminAds = lazyPage(() => import('./pages/AdminAds'));
const AdminCommunityPublisher = lazyPage(() => import('./pages/AdminCommunityPublisher'));
const AdminDiscovery = lazyPage(() => import('./pages/AdminDiscovery'));
const AdminIntegrity = lazyPage(() => import('./pages/AdminIntegrity'));
const AdminBI = lazyPage(() => import('./pages/AdminBI'));
const AdminOps = lazyPage(() => import('./pages/AdminOps'));
const AdminGauges = lazyPage(() => import('./pages/AdminGauges'));
const Track = lazyPage(() => import('./pages/Track'));
const MoveAssist = lazyPage(() => import('./pages/MoveAssist'));
const MoveAssistDashboard = lazyPage(() => import('./pages/MoveAssistDashboard'));
import ProtectedRoute from '@/components/ProtectedRoute';
import CityRedirect from '@/components/CityRedirect';

const RouteFallback = () => (
  <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Signed-in users (session token) get the blocking spinner while their
  // session is verified. Anonymous visitors paint immediately — public pages
  // render while the checks finish in the background, and any auth error
  // still replaces the UI below.
  if (Boolean(appParams.token) && (isLoadingPublicSettings || isLoadingAuth)) {
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
    <Suspense fallback={<RouteFallback />}>
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
      <Route path="/contractor-membership" element={<MembershipCompare />} />
      <Route path="/contractor-onboarding" element={<ContractorOnboarding />} />
      <Route path="/coverage" element={<Coverage />} />
      <Route path="/region/:code" element={<ProvincePage />} />
      <Route path="/property-managers" element={<PropertyManagers />} />
      <Route path="/white-label" element={<WhiteLabel />} />
      <Route path="/white-label-pay" element={<WhiteLabelPay />} />
      <Route path="/software" element={<SoftwareSales />} />
      <Route path="/software-pay" element={<SoftwarePay />} />
      <Route path="/membership-pay" element={<MembershipPay />} />
      <Route path="/software/start" element={<SoftwareOnboarding />} />
      <Route path="/furniture-removal" element={<FurnitureRemoval />} />
      <Route path="/appliance-removal" element={<ApplianceRemoval />} />
      <Route path="/electronics-recycling" element={<ElectronicsRecycling />} />
      <Route path="/commercial-recycling" element={<CommercialRecycling />} />
      <Route path="/same-day-pickup" element={<SameDayPickup />} />
      <Route path="/move-assist" element={<MoveAssist />} />
      <Route path="/move-assist/dashboard" element={<MoveAssistDashboard />} />
      <Route path="/services" element={<ExploreServices />} />
      <Route path="/service-finder" element={<ServiceFinder />} />
      <Route path="/request-service" element={<RequestService />} />
      <Route path="/request-status" element={<RequestStatus />} />
      <Route path="/track" element={<Track />} />
      <Route path="/change-order" element={<ChangeOrderRespond />} />
      <Route path="/community" element={<Community />} />
      <Route path="/community/member/:profileId" element={<CommunityMemberProfile />} />
      <Route path="/ai-booking" element={<AIBookingCenter />} />
      <Route path="/demand" element={<DemandPage />} />
      <Route path="/live" element={<LiveCentre />} />
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
          <Route path="/admin/pipeline" element={<AdminPipeline />} />
          <Route path="/admin/gbp" element={<AdminGbpPipeline />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
          <Route path="/admin/partners" element={<AdminPartners />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/payouts" element={<AdminPayouts />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/acquisition" element={<AdminAcquisition />} />
          <Route path="/admin/contractor-ops" element={<AdminContractorOps />} />
          <Route path="/admin/contractor-acquisition" element={<AdminContractorAcquisition />} />
          <Route path="/admin/franchise-review" element={<AdminFranchiseReview />} />
          <Route path="/admin/conversion" element={<AdminConversion />} />
          <Route path="/admin/agreements" element={<AdminAgreements />} />
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/admin/reputation" element={<AdminReputation />} />
          <Route path="/admin/sms" element={<AdminSms />} />
          <Route path="/admin/sales" element={<AdminSalesIntelligence />} />
          <Route path="/admin/cities" element={<AdminCities />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/keywords" element={<AdminKeywords />} />
          <Route path="/admin/system" element={<AdminSystem />} />
          <Route path="/admin/search-intelligence" element={<AdminSearchIntelligence />} />
          <Route path="/admin/search-authority" element={<AdminSearchAuthority />} />
          <Route path="/admin/intelligence" element={<AdminIntelligence />} />
          <Route path="/admin/business-master" element={<AdminBusinessMaster />} />
          <Route path="/admin/growth" element={<AdminGrowth />} />
          <Route path="/admin/growth-engine" element={<AdminGrowthEngine />} />
          <Route path="/admin/growth-command" element={<AdminGrowthCommand />} />
          <Route path="/admin/improvements" element={<AdminImprovements />} />
          <Route path="/admin/community" element={<AdminCommunity />} />
          <Route path="/admin/discovery" element={<AdminDiscovery />} />
          <Route path="/admin/integrity" element={<AdminIntegrity />} />
          <Route path="/admin/bi" element={<AdminBI />} />
          <Route path="/admin/gauges" element={<AdminGauges />} />
          <Route path="/admin/ops" element={<AdminOps />} />
          <Route path="/admin/ads" element={<AdminAds />} />
          <Route path="/admin/publisher" element={<AdminCommunityPublisher />} />
          <Route path="/admin/demand" element={<AdminDemand />} />
          <Route path="/admin/observatory" element={<AdminDemandObservatory />} />
          <Route path="/admin/seo" element={<AdminSeoCommand />} />
          <Route path="/admin/seo-action" element={<AdminSeoAction />} />
          <Route path="/admin/routes" element={<AdminRoutes />} />
        </Route>
        <Route path="/admin/pricing" element={<AdminPricing />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/directory" element={<AdminDirectory />} />
        <Route path="/admin/facebook" element={<AdminFacebook />} />
        <Route path="/admin/white-label" element={<AdminWhiteLabel />} />
        <Route path="/admin/gallery" element={<AdminGallery />} />
        <Route path="/admin/marketing" element={<AdminMarketing />} />
      <Route path="/admin/marketing-command" element={<AdminMarketingCommand />} />
        <Route path="/admin/software" element={<AdminSoftware />} />
        <Route path="/admin/national" element={<AdminNational />} />
        <Route path="/company" element={<CompanyDashboard />} />
        <Route path="/finance" element={<FinanceDashboard />} />
        <Route path="/partners" element={<PartnersDashboard />} />
        <Route path="/partner-register" element={<PartnerRegister />} />
        <Route path="/realtor-dashboard" element={<RealtorDashboard />} />
      </Route>
      <Route path="/city/:cityName" element={<CityRedirect />} />
      <Route path="/:pageSlug" element={<CityPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
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