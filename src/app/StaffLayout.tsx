import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LogOut, User, ShoppingCart, Moon, Sun, BarChart3 } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';
import { useTheme } from '../shared/context/ThemeContext';
import { AppProvider } from '../shared/context/AppContext';
import { APP, COLORS } from '../shared/constants';

const ItemListPage = lazy(() => import('../routes/ItemList/ItemList'));
const MenuPage = lazy(() => import('../customer/Menu/MenuPage'));
const CheckoutPage = lazy(() => import('../routes/Checkout/Checkout'));
const TransactionListPage = lazy(() => import('../routes/Transactions/TransactionList'));
const TransactionDetailPage = lazy(() => import('../routes/Transactions/TransactionDetail'));
const CustomerTransactionDetailPage = lazy(() => import('../customer/Transactions/CustomerTransactionDetail'));
const ProfilePage = lazy(() => import('../routes/Profile/ProfilePage'));
const PendingOrdersPage = lazy(() => import('../routes/PendingOrders/PendingOrdersPage'));
const PendingOrderDetailPage = lazy(() => import('../routes/PendingOrders/PendingOrderDetail'));
const AnalyticsPage = lazy(() => import('../routes/Analytics/AnalyticsPage'));

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
      <Link
        to="/analytics"
        className="px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer font-heading"
        style={{
          color: isActive('/analytics') ? COLORS.primary : COLORS.textSecondary,
          borderColor: isActive('/analytics') ? COLORS.primary : 'transparent',
        }}
      >
        <BarChart3 size={16} className="inline mr-2" />
        Analytics
      </Link>
    </div>
  );
}

export default function StaffLayout() {
  const { user, signOut } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) main.focus();
  }, [location.pathname]);

  if (!user) return null;

  return (
    <AppProvider basketKey="pos-shop-staff-basket">
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: COLORS.background }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Skip to content
        </a>
        <header
          className="px-4 sm:px-6 py-4 sticky top-0 z-50 shadow-sm"
          style={{
            backgroundColor: COLORS.cardBackground,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="text-xl sm:text-2xl font-bold font-heading" style={{ color: COLORS.primary }}>
              {APP.name}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1"
                style={{ color: COLORS.textSecondary }}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
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
        <main className="flex-1 p-4 sm:p-6" id="main-content" tabIndex={-1}>
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
    <Route path="/public/transactions/:id" element={<CustomerTransactionDetailPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/pending-orders" element={<PendingOrdersPage />} />
    <Route path="/pending-orders/:id" element={<PendingOrderDetailPage />} />
    <Route path="/analytics" element={<AnalyticsPage />} />
  </Routes>
</Suspense>
            </div>
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
