import { useState, useEffect, useMemo } from 'react';
import { Minus, Plus, ShoppingBag, ShoppingCart, RefreshCw, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import type { Item } from '../../lib/supabase';
import { getSignedImageUrl } from '../../lib/supabase';

interface ItemCardProps {
  item: Item;
  index: number;
}

function ItemCard({ item, index }: ItemCardProps) {
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
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton flex items-center justify-center">
            <ShoppingBag className="text-gray-200" size={32} />
          </div>
        )}
        <img
          src={imageSrc}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          {basketQty === 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToBasket(item.id);
              }}
              className="bg-white text-black p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 active:scale-90"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {basketQty > 0 && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10 animate-scale-in">
            {basketQty}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-900 mb-1 font-heading line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-black font-heading text-primary">
            ฿{item.price.toLocaleString()}
          </span>

          {basketQty > 0 ? (
            <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromBasket(item.id);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
                aria-label="Remove"
              >
                <Minus size={14} className="text-danger" />
              </button>
              <span className="text-sm font-bold w-8 text-center">{basketQty}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToBasket(item.id);
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
                aria-label="Add"
              >
                <Plus size={14} className="text-primary" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToBasket(item.id);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-900 text-white hover:bg-black active:scale-90 transition-all shadow-md"
              aria-label="Add to cart"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { items, total, basket, loading: itemsLoading, refreshItems } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = Array.from(basket.values()).reduce((a, b) => a + b, 0);

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshItems();
    setRefreshing(false);
  };

  if (itemsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-10 w-48 skeleton mb-8"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-full aspect-square rounded-xl skeleton mb-4"></div>
              <div className="skeleton h-4 w-3/4 mb-2"></div>
              <div className="skeleton h-6 w-1/4 mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="skeleton w-16 h-4"></div>
                <div className="skeleton w-10 h-10 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 animate-fade-in">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-gray-900">
            Our Menu
          </h1>
          <p className="text-gray-500 font-medium">
            Explore our curated selection of quality items
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all active:scale-90 disabled:opacity-50"
            title="Refresh items"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {totalItems > 0 && (
        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl sticky mb-8 transition-all duration-300 border border-white/20 backdrop-blur-md bg-white/80"
          style={{
            top: '20px',
            zIndex: 40,
          }}
        >
          <div className="p-2 bg-primary text-white rounded-xl shadow-lg">
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Basket</div>
            <div className="font-black text-gray-900">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</div>
          </div>

          <div className="ml-auto text-right mr-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</div>
            <div className="text-xl font-black text-primary font-heading">฿{total.toLocaleString()}</div>
          </div>


        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No items found</h3>
          <p className="text-gray-500 mt-2 max-w-xs text-center">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}"`
              : "There are no items available in the menu right now."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredItems.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}

      {totalItems > 0 && (
        <div className="mt-16 text-center">
          <Link
            to="/checkout"
            className="btn-primary px-12 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0 inline-flex items-center gap-3"
          >
            Review Order & Checkout
            <Plus size={20} />
          </Link>
        </div>
      )}
    </div>
  );
}