import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';

import './css/style.css';

// Import pages
import Homepage from './pages/Homepage';
import ListingsFeed from './pages/ListingsFeed';
import ListingDetail from './pages/ListingDetail';
import DealPipeline from './pages/DealPipeline';
import DealDetail from './pages/DealDetail';
import PageNotFound from './pages/utility/PageNotFound';
import DataPreloader from './services/DataPreloader';

// Authentication pages
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './pages/ProtectedRoute';

// Settings pages
import Account from './pages/settings/Account';

function App() {
  const location = useLocation();

  // Preload data on app initialization
  useEffect(() => {
    DataPreloader.preloadEssentialData();
  }, []);

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Homepage */}
        <Route exact path="/" element={<Homepage />} />
        
        {/* Authentication routes - PUBLIC ACCESS */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Feed routes - PUBLIC ACCESS */}
        <Route path="/feed" element={<ListingsFeed />} />
        <Route path="/feed/:id" element={<ListingDetail />} />
        
        {/* Protected Deal Pipeline routes */}
        <Route path="/deals" element={
          <ProtectedRoute>
            <DealPipeline />
          </ProtectedRoute>
        } />
        <Route path="/deals/:id" element={
          <ProtectedRoute>
            <DealDetail />
          </ProtectedRoute>
        } />
        
        {/* Protected Settings routes */}
        <Route path="/settings/account" element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } />
        
        {/* Legacy redirects */}
        <Route path="/listings" element={<Navigate to="/feed" replace />} />
        <Route path="/listings/:id" element={<Navigate to="/feed/:id" replace />} />
        
        {/* 404 page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;