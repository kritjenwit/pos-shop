import { useState } from 'react';
import { ShoppingBag, Package, CreditCard } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import ItemListPage from './pages/ItemList/ItemList';
import ItemManagementPage from './pages/ItemManagement/ItemManagement';
import CheckoutPage from './pages/Checkout/Checkout';
import './index.css';

type Tab = 'items' | 'management' | 'checkout';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('items');

  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">POS Shop</h1>
          <nav className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'items'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('items')}
            >
              <ShoppingBag size={18} />
              <span>Items</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'management'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('management')}
            >
              <Package size={18} />
              <span>Management</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'checkout'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('checkout')}
            >
              <CreditCard size={18} />
              <span>Checkout</span>
            </button>
          </nav>
        </header>
        <main className="flex-1 p-6">
          {activeTab === 'items' && <ItemListPage />}
          {activeTab === 'management' && <ItemManagementPage />}
          {activeTab === 'checkout' && <CheckoutPage />}
        </main>
      </div>
    </AppProvider>
  );
}

export default App;