
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SupabaseTest } from "@/components/SupabaseTest";
import Index from "./pages/Index";
import ListingDetail from "./pages/ListingDetail";
import SavedListings from "./pages/SavedListings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import SavedListingsDashboard from "./pages/dashboard/SavedListings";
import SavedListingDetail from "./pages/dashboard/SavedListingDetail";
import BusinessAnalysis from "./pages/dashboard/BusinessAnalysis";
import Notifications from "./pages/dashboard/Notifications";
import Settings from "./pages/dashboard/Settings";
import AIAnalysis from "./pages/dashboard/AIAnalysis";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* All routes wrapped in DashboardLayout */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Index />} />
              <Route path="saved" element={<SavedListings />} />
              <Route path="listing/:id" element={<ListingDetail />} />
              <Route path="dashboard" element={<Overview />} />
              <Route path="dashboard/saved" element={<SavedListingsDashboard />} />
              <Route path="dashboard/saved/:id" element={<SavedListingDetail />} />
              <Route path="dashboard/ai-analysis" element={<AIAnalysis />} />
              <Route path="dashboard/analysis/:analysisId" element={<BusinessAnalysis />} />
              <Route path="dashboard/notifications" element={<Notifications />} />
              <Route path="dashboard/settings" element={<Settings />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
