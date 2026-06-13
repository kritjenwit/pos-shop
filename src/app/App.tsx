import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '../shared/context/AuthContext';
import { AppProvider } from '../shared/context/AppContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import LoadingScreen from './LoadingScreen';
import PublicRoutes from './PublicRoutes';
import StaffLayout from './StaffLayout';
import '../index.css';

const LoginPage = lazy(() => import('../routes/Login/LoginPage'));

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  const isPublicPath = location.pathname === '/menu' || location.pathname === '/checkout' || location.pathname.startsWith('/public/') || location.pathname.startsWith('/checkout/');

  if (!user && isPublicPath) {
    return (
      <AppProvider basketKey="pos-shop-customer-basket">
        <PublicRoutes />
      </AppProvider>
    );
  }

  if (!user) {
    return (
      <main tabIndex={-1}>
        <Suspense fallback={<LoadingScreen />}>
          <LoginPage />
        </Suspense>
      </main>
    );
  }

  return <StaffLayout />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
