import { lazy, Suspense } from 'react';
import { LogOut, User, ShoppingCart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { APP, COLORS } from './constants';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

const ItemListPage = lazy(() => import('./pages/ItemList/ItemList'));
const PublicTransactionDetailPage = lazy(() => import('./pages/Public/PublicTransactionDetail'));
const PublicCheckoutPage = lazy(() => import('./pages/Public/PublicCheckoutPage'));
const TransactionListPage = lazy(() => import('./pages/Transactions/TransactionList'));
const TransactionDetailPage = lazy(() => import('./pages/Transactions/TransactionDetail'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const MenuPage = lazy(() => import('./pages/Menu/MenuPage'));
const PendingOrdersPage = lazy(() => import('./pages/PendingOrders/PendingOrdersPage'));
const PendingOrderDetailPage = lazy(() => import('./pages/PendingOrders/PendingOrderDetail'));
const CheckoutPage = lazy(() => import('./pages/Checkout/Checkout'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="skeleton h-8 w-32"></div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex gap-2 border-b" style={{ borderColor: COLORS.border }}>
      <Link
        to="/"
        className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer font-heading"
        style={{
          color: isActive('/') && !isActive('/transactions') ? COLORS.primary : COLORS.textSecondary,
          borderColor: isActive('/') && !isActive('/transactions') ? COLORS.primary : 'transparent',
        }}
      >
        <ShoppingCart size={16} className="inline mr-2" />
        POS
      </Link>
      <Link
        to="/transactions"
        className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer font-heading"
        style={{
          color: isActive('/transactions') ? COLORS.primary : COLORS.textSecondary,
          borderColor: isActive('/transactions') ? COLORS.primary : 'transparent',
        }}
      >
        Transactions
      </Link>
      <Link
        to="/pending-orders"
        className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer font-heading"
        style={{
          color: isActive('/pending-orders') ? COLORS.primary : COLORS.textSecondary,
          borderColor: isActive('/pending-orders') ? COLORS.primary : 'transparent',
        }}
      >
        Pending Orders
      </Link>
    </div>
  );
}

function AppContent() {
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="skeleton h-8 w-32"></div>
      </div>
    );
  }

  // Public access routes: allow public viewing without authentication
  if (!user && (location.pathname === '/menu' || location.pathname === '/checkout' || location.pathname.startsWith('/public/') || location.pathname.startsWith('/checkout/'))) {
    return (
      <AppProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<PublicCheckoutPage />} />
            <Route path="/public/transactions/:id" element={<PublicTransactionDetailPage />} />
          </Routes>
        </Suspense>
      </AppProvider>
    );
  }
  
  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <header
          className="px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBackground,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold font-heading" style={{ color: COLORS.primary }}>
              {APP.name}
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/profile" className="flex items-center gap-2 text-sm hover:opacity-80 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1" style={{ color: COLORS.textSecondary }}>
                <User size={16} />
                <span className="hidden sm:inline">{user.full_name || user.email}</span>
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1"
                style={{ color: COLORS.textSecondary }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Navigation />
            <div className="mt-4">
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    <Route path="/" element={<ItemListPage />} />
    <Route path="/menu" element={<MenuPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/checkout/:orderId" element={<CheckoutPage />} />
    <Route path="/transactions" element={<TransactionListPage />} />
    <Route path="/transactions/:id" element={<TransactionDetailPage />} />
    <Route path="/public/transactions/:id" element={<PublicTransactionDetailPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/pending-orders" element={<PendingOrdersPage />} />
    <Route path="/pending-orders/:id" element={<PendingOrderDetailPage />} />
  </Routes>
</Suspense>
            </div>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
