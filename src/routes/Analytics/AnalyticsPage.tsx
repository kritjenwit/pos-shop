import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';
import { COLORS } from '../../shared/constants';
import { getSalesSummary, getDailySales, getTopItems } from '../../shared/lib/analytics';
import type { SalesSummary, DailySales, TopItem } from '../../shared/lib/analytics';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  const fetchAnalytics = async (d: number) => {
    setLoading(true);
    setError('');

    const [summaryRes, dailyRes, topRes] = await Promise.all([
      getSalesSummary(d),
      getDailySales(d),
      getTopItems(d),
    ]);

    if (summaryRes.error || dailyRes.error || topRes.error) {
      setError(summaryRes.error || dailyRes.error || topRes.error || 'Failed to load analytics');
    } else {
      setSummary(summaryRes.data);
      setDailySales(dailyRes.data || []);
      setTopItems(topRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const handleDaysChange = (d: number) => {
    setDays(d);
  };

  const maxDailyRevenue = Math.max(...dailySales.map((d) => d.revenue), 0);

  const formatCurrency = (val: number) => `฿${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in" role="status" aria-label="Loading analytics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
              <div className="skeleton h-4 w-20 mb-3"></div>
              <div className="skeleton h-8 w-32 mb-2"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="skeleton h-5 w-28 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-3 w-12"></div>
                <div className="skeleton h-6 flex-1 rounded-sm"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="skeleton h-5 w-24 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 w-6"></div>
                <div className="skeleton h-4 w-32 flex-1"></div>
                <div className="skeleton h-4 w-16"></div>
                <div className="skeleton h-4 w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200" role="alert">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
          Sales Dashboard
        </h2>
        <div className="flex items-center gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 cursor-pointer font-medium ${
                days === d ? 'shadow-sm' : 'hover:shadow-sm'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              style={{
                backgroundColor: days === d ? COLORS.primary : COLORS['primary-10'],
                color: days === d ? '#fff' : COLORS.primary,
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} style={{ color: COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Total Revenue</span>
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: COLORS.text }}>
            {summary ? formatCurrency(summary.totalRevenue) : '฿0.00'}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Last {days} days
          </p>
        </div>
        <div className="p-5 rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart size={18} style={{ color: COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Total Orders</span>
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: COLORS.text }}>
            {summary ? summary.totalOrders.toLocaleString() : '0'}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Last {days} days
          </p>
        </div>
        <div className="p-5 rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} style={{ color: COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold font-heading" style={{ color: COLORS.text }}>
            {summary ? formatCurrency(summary.avgOrderValue) : '฿0.00'}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>
            Last {days} days
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} style={{ color: COLORS.primary }} />
          <h3 className="text-base font-bold font-heading" style={{ color: COLORS.text }}>Daily Sales</h3>
        </div>
        <div className="space-y-2">
          {dailySales.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: COLORS.textSecondary }}>
              No sales data for this period
            </p>
          ) : (
            dailySales.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs w-12 text-right shrink-0 font-medium" style={{ color: COLORS.textSecondary }}>
                  {day.date.slice(5)}
                </span>
                <div className="flex-1 h-7 rounded-sm relative overflow-hidden" style={{ backgroundColor: COLORS['primary-10'] }}>
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0}%`,
                      backgroundColor: COLORS.primary,
                    }}
                    aria-label={`฿${day.revenue.toFixed(2)} on ${day.date}`}
                  ></div>
                </div>
                <span className="text-xs w-20 text-right shrink-0 font-medium" style={{ color: COLORS.text }}>
                  {formatCurrency(day.revenue)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl shadow-sm border" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.border }}>
        <h3 className="text-base font-bold font-heading mb-4" style={{ color: COLORS.text }}>
          Top Items
        </h3>
        {topItems.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: COLORS.textSecondary }}>
            No items sold in this period
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: COLORS.textSecondary }}>
                  <th className="pb-2 pr-4 font-medium">Rank</th>
                  <th className="pb-2 pr-4 font-medium">Item</th>
                  <th className="pb-2 pr-4 font-medium text-right">Qty Sold</th>
                  <th className="pb-2 pr-4 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item) => (
                  <tr key={item.rank} className="border-t" style={{ borderColor: COLORS.border }}>
                    <td className="py-2 pr-4" style={{ color: COLORS.textSecondary }}>{item.rank}</td>
                    <td className="py-2 pr-4 font-medium" style={{ color: COLORS.text }}>{item.name}</td>
                    <td className="py-2 pr-4 text-right" style={{ color: COLORS.text }}>{item.qtySold}</td>
                    <td className="py-2 pr-4 text-right" style={{ color: COLORS.text }}>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
