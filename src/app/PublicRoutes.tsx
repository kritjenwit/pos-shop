import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const MenuPage = lazy(() => import('../customer/Menu/MenuPage'));
const CustomerCheckoutPage = lazy(() => import('../customer/Checkout/CustomerCheckoutPage'));
const CustomerTransactionDetailPage = lazy(() => import('../customer/Transactions/CustomerTransactionDetail'));

function PublicLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="skeleton h-8 w-32"></div>
    </div>
  );
}

export default function PublicRoutes() {
  return (
    <>
      <a
        href="#public-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:text-primary focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to content
      </a>
      <main id="public-content" tabIndex={-1}>
        <Suspense fallback={<PublicLoadingFallback />}>
          <Routes>
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/checkout" element={<CustomerCheckoutPage />} />
            <Route path="/public/transactions/:id" element={<CustomerTransactionDetailPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
