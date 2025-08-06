import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';

import './css/style.css';

// Import only essential pages for business listings
import ListingsFeed from './pages/ListingsFeed';
import ListingDetail from './pages/ListingDetail';
import OffMarketDeals from './pages/OffMarketDeals';
import OffMarketSellerDetails from './pages/OffMarketSellerDetails';

// Simple auth pages (will be simplified later)
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import PageNotFound from './pages/utility/404';

// For now, keeping minimal auth
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Main route redirects to listings */}
        <Route exact path="/" element={<Navigate to="/listings" replace />} />
        
        {/* Core business listings routes */}
        <Route path="/listings" element={<ProtectedRoute><ListingsFeed /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/off-market-deals" element={<ProtectedRoute><OffMarketDeals /></ProtectedRoute>} />
        <Route path="/off-market-seller/:id" element={<ProtectedRoute><OffMarketSellerDetails /></ProtectedRoute>} />
        
        {/* Basic auth routes - will simplify later */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* 404 page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}