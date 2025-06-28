
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
import Profile from "./pages/dashboard/Profile";
import SavedListingsDashboard from "./pages/dashboard/SavedListings";
import Activity from "./pages/dashboard/Activity";
import Notifications from "./pages/dashboard/Notifications";
import Settings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/saved" element={<SavedListings />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="saved" element={<SavedListingsDashboard />} />
              <Route path="activity" element={<Activity />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
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
