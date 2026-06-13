import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight, X, Search, Receipt, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLORS } from '../../shared/constants';
import { getCache, setCache, invalidateCache } from '../../shared/lib/cache';
import { getOrders } from '../../shared/lib/orders';
import type { OrderSummary } from '../../shared/lib/orders';
import { searchSellers as searchSellerProfiles, type SellerOption } from '../../shared/lib/profiles';

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerOptions, setSellerOptions] = useState<SellerOption[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getCacheKey = () => {
    return `transactions-${currentPage}-${startDate || ''}-${endDate || ''}-${selectedSeller?.id || ''}`;
  };

  const fetchTransactions = async (useCache = true) => {
    const cacheKey = getCacheKey();
    if (useCache) {
      const cached = getCache<OrderSummary[]>(cacheKey);
      if (cached) {
        setTransactions(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError('');
    const { data, total, error: fetchErr } = await getOrders({
      page: currentPage,
      pageSize,
      dateRange: startDate || endDate ? { start: startDate ? `${startDate}T00:00:00` : undefined, end: endDate ? `${endDate}T23:59:59` : undefined } : undefined,
      sellerId: selectedSeller?.id || undefined,
    });

    if (fetchErr) {
      setError(typeof fetchErr === 'string' ? fetchErr : 'Failed to load transactions');
      console.error('Error fetching transactions:', fetchErr);
      setLoading(false);
      return;
    }

    if (data) {
      setCache(cacheKey, data);
      setTransactions(data);
      setTotalCount(total || 0);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    invalidateCache(getCacheKey());
    setCurrentPage(1);
    await fetchTransactions(false);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSellerQuery('');
    setSelectedSeller(null);
  };

  const searchSellers = async () => {
    const { data } = await searchSellerProfiles(sellerQuery);
    setSellerOptions(data || []);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedSeller]);

  useEffect(() => {
    fetchTransactions(true);
  }, [currentPage, startDate, endDate, selectedSeller]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (sellerQuery.length >= 1) {
      debounceRef.current = setTimeout(() => {
        searchSellers();
      }, 300);
    } else {
      setSellerOptions([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sellerQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: COLORS['primary-15'], color: COLORS.primary };
      case 'approved': return { bg: COLORS['accent-15'], color: COLORS.accent };
      case 'pending': return { bg: COLORS['textSecondary-15'], color: COLORS.textSecondary };
      case 'cancelled': return { bg: COLORS['danger-15'], color: COLORS.danger };
      default: return { bg: COLORS['textSecondary-15'], color: COLORS.textSecondary };
    }
  };

  const getSellerDisplayName = (seller: SellerOption) => {
    return seller.full_name || seller.email;
  };

  const hasFilters = startDate || endDate || selectedSeller;

  const setDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      return;
    }
    const endStr = todayStr;
    if (preset === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(endStr);
      return;
    }
    if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(endStr);
      return;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
          Transactions
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            style={{ color: COLORS.primary, backgroundColor: COLORS['primary-10'] }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              style={{ color: COLORS.danger, backgroundColor: COLORS['danger-10'] }}
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.cardBackground, border: `1px solid ${COLORS.border}` }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-base" style={{ color: COLORS.textSecondary }}>
              Start Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="label-base" style={{ color: COLORS.textSecondary }}>
              End Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          <div ref={dropdownRef} className="relative">
            <label className="label-base" style={{ color: COLORS.textSecondary }}>
              Seller
            </label>
            <div className="flex items-center gap-2">
              <Search size={16} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
              {selectedSeller ? (
                <div
                  className="flex-1 flex items-center justify-between px-3 py-2 border rounded text-sm transition-all duration-200"
                  style={{ borderColor: COLORS.primary, backgroundColor: COLORS['primary-10'] }}
                >
                  <span className="truncate font-medium" style={{ color: COLORS.text }}>{getSellerDisplayName(selectedSeller)}</span>
                  <button
                    onClick={() => {
                      setSelectedSeller(null);
                      setSellerQuery('');
                    }}
                    className="p-1 hover:bg-white/50 rounded transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Clear seller filter"
                  >
                    <X size={14} style={{ color: COLORS.textSecondary }} />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search seller..."
                  className="input-base"
                />
              )}
            </div>

            {showDropdown && sellerOptions.length > 0 && !selectedSeller && (
              <div
                className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg overflow-hidden animate-scale-in"
                style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}
              >
                {sellerOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedSeller(option);
                      setSellerQuery('');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 cursor-pointer hover:bg-slate-50"
                    style={{ color: COLORS.text }}
                  >
                    <div className="font-medium">{getSellerDisplayName(option)}</div>
                    <div className="text-xs" style={{ color: COLORS.textSecondary }}>
                      {option.email}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Quick:</span>
          {(['today', 'week', 'month', 'all'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className="px-2.5 py-1 text-xs rounded-md transition-all duration-200 cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ backgroundColor: COLORS['primary-10'], color: COLORS.primary }}
            >
              {preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2" role="status" aria-label="Loading transactions">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="skeleton h-6 w-24"></div>
                  <div className="skeleton h-4 w-40"></div>
                </div>
                <div className="skeleton h-4 w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
          <Receipt size={48} style={{ color: COLORS.textSecondary }} />
          <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>No transactions found</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            {hasFilters ? 'Try adjusting your filters' : 'Complete an order to see it here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <Link
              key={t.id}
              to={`/transactions/${t.id}`}
              className="w-full text-left p-4 rounded-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary block"
              style={{
                backgroundColor: COLORS.cardBackground,
                border: `1px solid ${COLORS.border}`,
                textDecoration: 'none',
              }}
            >
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-semibold font-heading" style={{ color: COLORS.text }}>
                             ฿{t.totalAmount.toFixed(2)}
                           </span>
                           <span
                             className="text-xs px-2 py-0.5 rounded-full font-semibold"
                             style={getStatusStyle(t.status)}
                           >
                             {t.status}
                           </span>
                           {t.orderId && (
                             <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                               {t.orderId}
                             </span>
                           )}
                           {t.receiptUrl && (
                             <Receipt size={14} style={{ color: COLORS.primary }} />
                           )}
                         </div>
                         <div className="text-sm" style={{ color: COLORS.textSecondary }}>
                           {t.itemsCount} items • {t.sellerName || t.sellerEmail || 'Unknown'}
                         </div>
                         {t.additionalDetail && (
                           <div className="text-xs mt-1 truncate max-w-xs" style={{ color: COLORS.textSecondary }}>
                             {t.additionalDetail}
                           </div>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                           {formatDate(t.createdAt)}
                         </span>
                         <ChevronRight size={16} style={{ color: COLORS.textSecondary }} />
                       </div>
                     </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS['primary-10'], color: COLORS.primary }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className="w-8 h-8 rounded text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                backgroundColor: page === currentPage ? COLORS.primary : COLORS['primary-10'],
                color: page === currentPage ? '#ffffff' : COLORS.primary,
              }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS['primary-10'], color: COLORS.primary }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
