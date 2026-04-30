import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight, X, Search, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';

interface TransactionWithItems {
  id: string;
  total_amount: number;
  status: string;
  created_by: string;
  created_at: string;
  user_email?: string;
  user_full_name?: string;
  item_count?: number;
  receipt_url?: string | null;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export default function TransactionListPage() {
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sellerQuery, setSellerQuery] = useState('');
  const [sellerOptions, setSellerOptions] = useState<UserOption[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<UserOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchSellers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email, full_name')
      .or(`email.ilike.%${sellerQuery}%,full_name.ilike.%${sellerQuery}%`)
      .limit(10);
    setSellerOptions(data || []);
  };

  const fetchTransactions = async () => {
    setLoading(true);

    let query = supabase
      .from('transactions')
      .select('*, users(email, full_name), receipt_url')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }
    if (selectedSeller) {
      query = query.eq('created_by', selectedSeller.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      const withCounts = await Promise.all(
        (data || []).map(async (t) => {
          const { count } = await supabase
            .from('transaction_items')
            .select('*', { count: 'exact', head: true })
            .eq('transaction_id', t.id);
          return {
            ...t,
            user_email: (t.users as { email?: string })?.email,
            user_full_name: (t.users as { full_name?: string | null })?.full_name,
            item_count: count || 0,
          };
        })
      );
      setTransactions(withCounts);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSellerQuery('');
    setSelectedSeller(null);
  };

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, selectedSeller]);

  useEffect(() => {
    if (sellerQuery.length >= 1) {
      searchSellers();
    } else {
      setSellerOptions([]);
    }
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
      case 'completed': return { bg: COLORS.primary + '15', color: COLORS.primary };
      case 'pending': return { bg: COLORS.accent + '15', color: COLORS.accent };
      case 'cancelled': return { bg: COLORS.danger + '15', color: COLORS.danger };
      default: return { bg: COLORS.textSecondary + '15', color: COLORS.textSecondary };
    }
  };

  const getSellerDisplayName = (seller: UserOption) => {
    return seller.full_name || seller.email;
  };

  const hasFilters = startDate || endDate || selectedSeller;

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
          Transactions
        </h2>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            style={{ color: COLORS.danger, backgroundColor: COLORS.danger + '10' }}
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
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
                  style={{ borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' }}
                >
                  <span className="truncate font-medium" style={{ color: COLORS.text }}>{getSellerDisplayName(selectedSeller)}</span>
                  <button
                    onClick={() => {
                      setSelectedSeller(null);
                      setSellerQuery('');
                    }}
                    className="p-1 hover:bg-white/50 rounded transition-colors duration-200 cursor-pointer focus-visible:outline-none"
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
      </div>

      {loading ? (
        <div className="space-y-2">
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
            <button
              key={t.id}
              onClick={() => handleNavigate(`/transactions/${t.id}`)}
              className="w-full text-left p-4 rounded-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                backgroundColor: COLORS.cardBackground,
                border: `1px solid ${COLORS.border}`,
              }}
            >
               <div className="flex justify-between items-start">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="font-semibold font-heading" style={{ color: COLORS.text }}>
                       ฿{t.total_amount.toFixed(2)}
                     </span>
                     <span
                       className="text-xs px-2 py-0.5 rounded-full font-semibold"
                       style={getStatusStyle(t.status)}
                     >
                       {t.status}
                     </span>
                     {t.receipt_url && (
                       <Receipt size={14} style={{ color: COLORS.primary }} />
                     )}
                   </div>
                   <div className="text-sm" style={{ color: COLORS.textSecondary }}>
                     {t.item_count} items • {t.user_full_name || t.user_email || 'Unknown'}
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                     {formatDate(t.created_at)}
                   </span>
                   <ChevronRight size={16} style={{ color: COLORS.textSecondary }} />
                 </div>
               </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
