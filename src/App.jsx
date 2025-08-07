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
import PageNotFound from './pages/utility/PageNotFound';

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
        
        {/* Core business listings routes - PUBLIC ACCESS */}
        <Route path="/listings" element={<ListingsFeed />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        
        {/* 404 page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;