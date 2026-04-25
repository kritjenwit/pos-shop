import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Package, CreditCard, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../lib/supabase';
import ItemManagementPage from '../ItemManagement/ItemManagement';
import CheckoutPage from '../Checkout/Checkout';
import { COLORS, GRID, UI } from '../../constants';

interface ItemCardProps {
  item: Item;
}

function ItemCard({ item }: ItemCardProps) {
  const { addToBasket, removeFromBasket, getBasketQuantity } = useApp();
  const basketQty = getBasketQuantity(item.id);

  const defaultImage = `https://placehold.co/150x150/f1f5f9/64748b?text=${encodeURIComponent(item.name.charAt(0))}`;
  const imageSrc = item.image || defaultImage;

  return (
    <div
      className="flex flex-col items-center hover:scale-[1.02] transition-transform p-3 rounded-lg shadow-sm"
      style={{ backgroundColor: COLORS.cardBackground }}
    >
      <div className="relative w-full aspect-square rounded overflow-hidden mb-3">
        <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
        {basketQty > 0 && (
          <span
            className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: COLORS.primary, color: '#ffffff' }}
          >
            {basketQty}
          </span>
        )}
      </div>
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.text }}>{item.name}</h3>
        <p className="text-base font-bold" style={{ color: COLORS.accent }}>฿{item.price}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: COLORS.danger,
            color: '#ffffff',
          }}
          onClick={() => removeFromBasket(item.id)}
          disabled={basketQty === 0}
        >
          <Minus size={16} />
        </button>
        <span className="text-base font-semibold min-w-[24px] text-center">{basketQty}</span>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: COLORS.accent,
            color: '#ffffff',
          }}
          onClick={() => addToBasket(item.id)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

type Tab = 'items' | 'management' | 'checkout';

export default function ItemListPage() {
  const { items, total, basket, loading: itemsLoading } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('items');
  const totalItems = Array.from(basket.values()).reduce((a, b) => a + b, 0);

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p style={{ color: COLORS.textSecondary }}>Loading...</p>
      </div>
    );
  }

  const tabButtonClass = (tab: Tab) =>
    `flex items-center gap-2 px-4 py-2 rounded transition-colors ${
      activeTab === tab
        ? ''
        : ''
    }`;

  return (
    <div className="max-w-6xl mx-auto">
      <nav className="flex gap-2 mb-6">
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
            className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-sm sticky mb-6"
            style={{
              backgroundColor: COLORS.cardBackground,
              top: UI.stickyTop,
              zIndex: 40,
            }}
          >
            <ShoppingCart size={20} />
            <span>{totalItems} items</span>
            <span className="ml-auto text-lg font-bold" style={{ color: COLORS.primary }}>฿{total}</span>
          </div>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${GRID.cols.sm}, 1fr)`,
            }}
          >
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {activeTab === 'management' && <ItemManagementPage />}
      {activeTab === 'checkout' && <CheckoutPage />}
    </div>
  );
}