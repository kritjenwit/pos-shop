import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const MenuPage = lazy(() => import('../customer/Menu/MenuPage'));
const CustomerCheckoutPage = lazy(() => import('../customer/Checkout/CustomerCheckoutPage'));
const CustomerTransactionDetailPage = lazy(() => import('../customer/Transactions/CustomerTransactionDetail'));

function PublicLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="skeleton h-8 w-32"></div>
    </div>
  );
}

export default function PublicRoutes() {
  return (
    <Suspense fallback={<PublicLoadingFallback />}>
      <Routes>
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/checkout" element={<CustomerCheckoutPage />} />
        <Route path="/public/transactions/:id" element={<CustomerTransactionDetailPage />} />
      </Routes>
    </Suspense>
  );
}
