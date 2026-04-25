import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../types';

interface ItemCardProps {
  item: Item;
}

function ItemCard({ item }: ItemCardProps) {
  const { addToBasket, removeFromBasket, getBasketQuantity } = useApp();
  const basketQty = getBasketQuantity(item.id);

  const defaultImage = `https://placehold.co/150x150/f1f5f9/64748b?text=${encodeURIComponent(item.name.charAt(0))}`;
  const imageSrc = item.image || defaultImage;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 flex flex-col items-center hover:scale-[1.02] transition-transform">
      <div className="relative w-full aspect-square rounded overflow-hidden mb-3">
        <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
        {basketQty > 0 && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {basketQty}
          </span>
        )}
      </div>
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold mb-1">{item.name}</h3>
        <p className="text-base font-bold text-emerald-500">฿{item.price}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => removeFromBasket(item.id)}
          disabled={basketQty === 0}
        >
          <Minus size={16} />
        </button>
        <span className="text-base font-semibold min-w-[24px] text-center">{basketQty}</span>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
          onClick={() => addToBasket(item.id)}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ItemListPage() {
  const { items, total, basket } = useApp();
  const totalItems = Array.from(basket.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm sticky top-24 z-40 mb-6">
        <ShoppingCart size={20} />
        <span>{totalItems} items</span>
        <span className="ml-auto text-lg font-bold text-blue-600">฿{total}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}