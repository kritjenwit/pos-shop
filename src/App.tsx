import { LogOut, User, ShoppingCart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ItemListPage from './pages/ItemList/ItemList';
import TransactionListPage from './pages/Transactions/TransactionList';
import TransactionDetailPage from './pages/Transactions/TransactionDetail';
import LoginPage from './pages/Login/LoginPage';
import ProfilePage from './pages/Profile/ProfilePage';
import { APP, COLORS } from './constants';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

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
    </div>
  );
}

function AppContent() {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="skeleton h-8 w-32"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
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
              <Routes>
                <Route path="/" element={<ItemListPage />} />
                <Route path="/transactions" element={<TransactionListPage />} />
                <Route path="/transactions/:id" element={<TransactionDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
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