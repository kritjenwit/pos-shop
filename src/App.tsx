import { LogOut, User, ShoppingCart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ItemListPage from './pages/ItemList/ItemList';
import TransactionListPage from './pages/Transactions/TransactionList';
import TransactionDetailPage from './pages/Transactions/TransactionDetail';
import LoginPage from './pages/Login/LoginPage';
import { APP, COLORS } from './constants';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  return (
    <div className="flex gap-4 border-b" style={{ borderColor: COLORS.border }}>
      <Link
        to="/"
        className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
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
        className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
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
        <p style={{ color: COLORS.textSecondary }}>Loading...</p>
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
          className="px-6 py-4 sticky top-0 z-50"
          style={{
            backgroundColor: COLORS.cardBackground,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold" style={{ color: COLORS.primary }}>
              {APP.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm" style={{ color: COLORS.textSecondary }}>
                <User size={16} />
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm hover"
                style={{ color: COLORS.textSecondary }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Navigation />
            <div className="mt-4">
              <Routes>
                <Route path="/" element={<ItemListPage />} />
                <Route path="/transactions" element={<TransactionListPage />} />
                <Route path="/transactions/:id" element={<TransactionDetailPage />} />
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