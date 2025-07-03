import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

import './css/style.css';

import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import DealPipeline from './pages/DealPipelineIntegrated';
import DealAnalytics from './pages/DealAnalytics';
import DealDetails from './pages/DealDetails';
import ListingsFeed from './pages/ListingsFeed';
import ListingDetail from './pages/ListingDetail';
import DealsDashboard from './pages/DealsDashboard';
import AIAnalysis from './pages/AIAnalysis';
import DealComparison from './pages/DealComparison';
import ASINTracker from './pages/ASINTracker';
import ASINDetail from './pages/ASINDetail';
import AmazonPortfolioAnalyzer from './pages/AmazonPortfolioAnalyzer';
import DocumentManager from './pages/DocumentManager';
import Portfolio from './pages/Portfolio';
import Explorer from './pages/ExplorerEnhanced';
import Fintech from './pages/Fintech';
import Customers from './pages/ecommerce/Customers';
import Orders from './pages/ecommerce/Orders';
import Invoices from './pages/ecommerce/Invoices';
import Shop from './pages/ecommerce/Shop';
import Shop2 from './pages/ecommerce/Shop2';
import Product from './pages/ecommerce/Product';
import Cart from './pages/ecommerce/Cart';
import Cart2 from './pages/ecommerce/Cart2';
import Cart3 from './pages/ecommerce/Cart3';
import Pay from './pages/ecommerce/Pay';
import Campaigns from './pages/Campaigns';
import UsersTabs from './pages/community/UsersTabs';
import UsersTiles from './pages/community/UsersTiles';
import Profile from './pages/community/Profile';
import Feed from './pages/community/Feed';
import Forum from './pages/community/Forum';
import ForumPost from './pages/community/ForumPost';
import Meetups from './pages/community/Meetups';
import MeetupsPost from './pages/community/MeetupsPost';
import CreditCards from './pages/finance/CreditCards';
import Transactions from './pages/finance/Transactions';
import TransactionDetails from './pages/finance/TransactionDetails';
import JobListing from './pages/job/JobListing';
import JobPost from './pages/job/JobPost';
import CompanyProfile from './pages/job/CompanyProfile';
import Messages from './pages/Messages';
import TasksKanban from './pages/tasks/TasksKanban';
import TasksList from './pages/tasks/TasksList';
import Inbox from './pages/Inbox';
import Calendar from './pages/Calendar';
import Account from './pages/settings/Account';
import Notifications from './pages/settings/Notifications';
import Apps from './pages/settings/Apps';
import Plans from './pages/settings/Plans';
import Billing from './pages/settings/Billing';
import Feedback from './pages/settings/Feedback';
import ServerDiagnostics from './components/ServerDiagnostics';
import Changelog from './pages/utility/Changelog';
import Roadmap from './pages/utility/Roadmap';
import Faqs from './pages/utility/Faqs';
import EmptyState from './pages/utility/EmptyState';
import PageNotFound from './pages/utility/PageNotFound';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Onboarding01 from './pages/Onboarding01';
import Onboarding02 from './pages/Onboarding02';
import Onboarding03 from './pages/Onboarding03';
import Onboarding04 from './pages/Onboarding04';
import ButtonPage from './pages/component/ButtonPage';
import FormPage from './pages/component/FormPage';
import DropdownPage from './pages/component/DropdownPage';
import AlertPage from './pages/component/AlertPage';
import ModalPage from './pages/component/ModalPage';
import PaginationPage from './pages/component/PaginationPage';
import TabsPage from './pages/component/TabsPage';
import BreadcrumbPage from './pages/component/BreadcrumbPage';
import BadgePage from './pages/component/BadgePage';
import AvatarPage from './pages/component/AvatarPage';
import TooltipPage from './pages/component/TooltipPage';
import AccordionPage from './pages/component/AccordionPage';
import IconsPage from './pages/component/IconsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  const location = useLocation();

  useEffect(() => {
    document.querySelector('html').style.scrollBehavior = 'auto'
    window.scroll({ top: 0 })
    document.querySelector('html').style.scrollBehavior = ''
  }, [location.pathname]); // triggered on route change

  return (
    <>
      <Routes>
        <Route exact path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><DealPipeline /></ProtectedRoute>} />
        <Route path="/deals/dashboard" element={<ProtectedRoute><DealsDashboard /></ProtectedRoute>} />
        <Route path="/deals/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />
        <Route path="/deals/comparison" element={<ProtectedRoute><DealComparison /></ProtectedRoute>} />
        <Route path="/deals/asin-tracker" element={<ProtectedRoute><ASINTracker /></ProtectedRoute>} />
        <Route path="/deals/asins/:asinId" element={<ProtectedRoute><ASINDetail /></ProtectedRoute>} />
        <Route path="/deals/amazon-portfolio" element={<ProtectedRoute><AmazonPortfolioAnalyzer /></ProtectedRoute>} />
        <Route path="/deals/documents" element={<ProtectedRoute><DocumentManager /></ProtectedRoute>} />
        <Route path="/deal/:id" element={<ProtectedRoute><DealDetails /></ProtectedRoute>} />
        <Route path="/deals/:id" element={<ProtectedRoute><DealDetails /></ProtectedRoute>} />
        <Route path="/listings" element={<ProtectedRoute><ListingsFeed /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/explorer" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
        <Route path="/dashboard/fintech" element={<ProtectedRoute><Fintech /></ProtectedRoute>} />
        <Route path="/ecommerce/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/ecommerce/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/ecommerce/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/ecommerce/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/ecommerce/shop-2" element={<ProtectedRoute><Shop2 /></ProtectedRoute>} />
        <Route path="/ecommerce/product" element={<ProtectedRoute><Product /></ProtectedRoute>} />
        <Route path="/ecommerce/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/ecommerce/cart-2" element={<ProtectedRoute><Cart2 /></ProtectedRoute>} />
        <Route path="/ecommerce/cart-3" element={<ProtectedRoute><Cart3 /></ProtectedRoute>} />
        <Route path="/ecommerce/pay" element={<ProtectedRoute><Pay /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/community/users-tabs" element={<ProtectedRoute><UsersTabs /></ProtectedRoute>} />
        <Route path="/community/users-tiles" element={<ProtectedRoute><UsersTiles /></ProtectedRoute>} />
        <Route path="/community/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/community/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/community/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
        <Route path="/community/forum-post" element={<ProtectedRoute><ForumPost /></ProtectedRoute>} />
        <Route path="/community/meetups" element={<ProtectedRoute><Meetups /></ProtectedRoute>} />
        <Route path="/community/meetups-post" element={<ProtectedRoute><MeetupsPost /></ProtectedRoute>} />
        <Route path="/finance/cards" element={<ProtectedRoute><CreditCards /></ProtectedRoute>} />
        <Route path="/finance/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/finance/transaction-details" element={<ProtectedRoute><TransactionDetails /></ProtectedRoute>} />
        <Route path="/job/job-listing" element={<ProtectedRoute><JobListing /></ProtectedRoute>} />
        <Route path="/job/job-post" element={<ProtectedRoute><JobPost /></ProtectedRoute>} />
        <Route path="/job/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/tasks/kanban" element={<ProtectedRoute><TasksKanban /></ProtectedRoute>} />
        <Route path="/tasks/list" element={<ProtectedRoute><TasksList /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/settings/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings/apps" element={<ProtectedRoute><Apps /></ProtectedRoute>} />
        <Route path="/settings/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        <Route path="/settings/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/settings/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/settings/server-diagnostics" element={<ProtectedRoute><ServerDiagnostics /></ProtectedRoute>} />
        <Route path="/utility/changelog" element={<Changelog />} />
        <Route path="/utility/roadmap" element={<Roadmap />} />
        <Route path="/utility/faqs" element={<Faqs />} />
        <Route path="/utility/empty-state" element={<EmptyState />} />
        <Route path="/utility/404" element={<PageNotFound />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding-01" element={<Onboarding01 />} />
        <Route path="/onboarding-02" element={<Onboarding02 />} />
        <Route path="/onboarding-03" element={<Onboarding03 />} />
        <Route path="/onboarding-04" element={<Onboarding04 />} />
        <Route path="/component/button" element={<ButtonPage />} />
        <Route path="/component/form" element={<FormPage />} />
        <Route path="/component/dropdown" element={<DropdownPage />} />
        <Route path="/component/alert" element={<AlertPage />} />
        <Route path="/component/modal" element={<ModalPage />} />
        <Route path="/component/pagination" element={<PaginationPage />} />
        <Route path="/component/tabs" element={<TabsPage />} />
        <Route path="/component/breadcrumb" element={<BreadcrumbPage />} />
        <Route path="/component/badge" element={<BadgePage />} />
        <Route path="/component/avatar" element={<AvatarPage />} />
        <Route path="/component/tooltip" element={<TooltipPage />} />
        <Route path="/component/accordion" element={<AccordionPage />} />
        <Route path="/component/icons" element={<IconsPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;
