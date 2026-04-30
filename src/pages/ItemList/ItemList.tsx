import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Package, CreditCard, ShoppingCart, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../lib/supabase';
import { getSignedImageUrl } from '../../lib/supabase';
import ItemManagementPage from '../ItemManagement/ItemManagement';
import CheckoutPage from '../Checkout/Checkout';
import { COLORS, UI } from '../../constants';

interface ItemCardProps {
  item: Item;
}

function ItemCard({ item }: ItemCardProps) {
  const { addToBasket, removeFromBasket, getBasketQuantity } = useApp();
  const basketQty = getBasketQuantity(item.id);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const defaultImage = `https://placehold.co/150x150/f1f5f9/64748b?text=${encodeURIComponent(item.name.charAt(0))}`;

  useEffect(() => {
    let cancelled = false;
    const resolveImage = async () => {
      const url = await getSignedImageUrl(item.image);
      if (!cancelled) {
        setImageSrc(url || defaultImage);
      }
    };
    resolveImage();
    return () => { cancelled = true; };
  }, [item.image, defaultImage]);

  return (
    <div
      className="flex flex-col items-center hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer p-3 rounded-lg shadow-sm"
      style={{ backgroundColor: COLORS.cardBackground }}
    >
      <div className="relative w-full aspect-square rounded overflow-hidden mb-3">
        {!imageLoaded && <div className="w-full h-full skeleton"></div>}
        <img
          src={imageSrc}
          alt={item.name}
          className={`w-full h-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {basketQty > 0 && (
          <span
            className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full font-heading shadow-sm"
            style={{ backgroundColor: COLORS.primary, color: '#ffffff' }}
          >
            {basketQty}
          </span>
        )}
      </div>
      <div className="text-center mb-3 w-full">
        <h3 className="text-sm font-semibold mb-1 font-heading truncate" style={{ color: COLORS.text }}>{item.name}</h3>
        <p className="text-base font-bold font-heading" style={{ color: COLORS.accent }}>฿{item.price}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          style={{ backgroundColor: COLORS.danger, color: '#ffffff' }}
          onClick={() => removeFromBasket(item.id)}
          disabled={basketQty === 0}
          aria-label={`Remove one ${item.name} from basket`}
        >
          <Minus size={16} />
        </button>
        <span className="text-base font-semibold min-w-[24px] text-center font-heading">{basketQty}</span>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{ backgroundColor: COLORS.accent, color: '#ffffff' }}
          onClick={() => addToBasket(item.id)}
          aria-label={`Add one ${item.name} to basket`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

type Tab = 'items' | 'management' | 'checkout';

export default function ItemListPage() {
  const { items, total, basket, loading: itemsLoading, refreshItems } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const [refreshing, setRefreshing] = useState(false);
  const totalItems = Array.from(basket.values()).reduce((a, b) => a + b, 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshItems();
    setRefreshing(false);
  };

  if (itemsLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
            <div className="w-full aspect-square rounded skeleton mb-3"></div>
            <div className="skeleton h-4 w-3/4 mx-auto mb-2"></div>
            <div className="skeleton h-5 w-1/4 mx-auto mb-3"></div>
            <div className="flex justify-center">
              <div className="skeleton w-24 h-8 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tabButtonClass = (tab: Tab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer font-heading font-medium ${
      activeTab === tab ? 'scale-[1.02]' : 'hover:bg-slate-50'
    }`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Make tabs responsive: on narrow screens allow horizontal scroll to prevent overflow */}
      <nav className="flex gap-2 mb-6 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'thin' }}>
        <button
          className={tabButtonClass('items')}
          style={{
            backgroundColor: activeTab === 'items' ? COLORS.primary : COLORS.cardBackground,
            color: activeTab === 'items' ? '#ffffff' : COLORS.textSecondary,
          }}
          onClick={() => setActiveTab('items')}
        >
          <ShoppingBag size={18} />
          Items
        </button>
        <button
          className={tabButtonClass('management')}
          style={{
            backgroundColor: activeTab === 'management' ? COLORS.primary : COLORS.cardBackground,
            color: activeTab === 'management' ? '#ffffff' : COLORS.textSecondary,
          }}
          onClick={() => setActiveTab('management')}
        >
          <Package size={18} />
          Management
        </button>
        <button
          className={tabButtonClass('checkout')}
          style={{
            backgroundColor: activeTab === 'checkout' ? COLORS.primary : COLORS.cardBackground,
            color: activeTab === 'checkout' ? '#ffffff' : COLORS.textSecondary,
          }}
          onClick={() => setActiveTab('checkout')}
        >
          <CreditCard size={18} />
          Checkout
        </button>
      </nav>

      {activeTab === 'items' && (
        <>
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-sm sticky mb-6 transition-all duration-200"
            style={{
              backgroundColor: COLORS.cardBackground,
              top: UI.stickyTop,
              zIndex: 40,
            }}
          >
            <ShoppingCart size={20} style={{ color: COLORS.primary }} />
            <span className="font-medium">{totalItems} items</span>
            <span className="ml-auto text-lg font-bold font-heading" style={{ color: COLORS.primary }}>฿{total}</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing || itemsLoading}
              className="p-2 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              style={{ color: COLORS.primary, backgroundColor: COLORS.primary + '10' }}
              aria-label="Refresh items"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingBag size={48} style={{ color: COLORS.textSecondary }} />
              <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>No items yet</p>
              <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Add your first item in Management</p>
              <button
                className="btn-primary mt-4"
                onClick={() => setActiveTab('management')}
              >
                Go to Management
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'management' && <ItemManagementPage />}
      {activeTab === 'checkout' && <CheckoutPage />}
    </div>
  );
}
