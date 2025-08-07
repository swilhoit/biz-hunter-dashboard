import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate
} from 'react-router-dom';

import './css/style.css';

// Import only essential pages for business listings
import Homepage from './pages/Homepage';
import ListingsFeed from './pages/ListingsFeed';
import ListingDetail from './pages/ListingDetail';
import PageNotFound from './pages/utility/PageNotFound';
import DataPreloader from './services/DataPreloader';

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
        
        {/* Feed routes - PUBLIC ACCESS */}
        <Route path="/feed" element={<ListingsFeed />} />
        <Route path="/feed/:id" element={<ListingDetail />} />
        
        {/* Legacy redirect */}
        <Route path="/listings" element={<Navigate to="/feed" replace />} />
        <Route path="/listings/:id" element={<Navigate to="/feed/:id" replace />} />
        
        {/* 404 page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;