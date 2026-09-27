import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { ExtractedProduct, ScrapeStats } from '../types/scraper.ts';
import { BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

interface AnalyticsChartsProps {
  products: ExtractedProduct[];
  stats: ScrapeStats;
  lang: 'ar' | 'en';
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ products, stats, lang }) => {
  const isAr = lang === 'ar';

  if (products.length === 0) return null;

  // 1. Price Distribution Data
  const priceData = products.slice(0, 10).map((p, idx) => ({
    name: p.brand || p.title.slice(0, 12) + '...',
    price: p.price,
    discount: p.discountPercentage || 0
  }));

  // 2. In Stock vs Out of Stock Data
  const inStockCount = products.filter(p => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;
  const stockPieData = [
    { name: isAr ? 'متاح بالمخزون' : 'In Stock', value: inStockCount || 1, color: '#10B981' },
    { name: isAr ? 'نفذت الكمية' : 'Out of Stock', value: outOfStockCount, color: '#EF4444' }
  ];

  return (
    <div className="bg-[#161F2E] border border-[#1E293B] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#00D9FF]" />
          <span>{isAr ? 'الرسوم البيانية والإحصائيات التوزيعية:' : 'Data Distribution & Pricing Analytics:'}</span>
        </h4>
        <span className="text-[11px] text-[#94A3B8] font-mono">
          {products.length} {isAr ? 'عينة مسجلة' : 'data points'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Price Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-[#0F1419] p-4 rounded-xl border border-[#1E293B] space-y-2">
          <span className="text-xs font-semibold text-[#94A3B8] block">
            {isAr ? 'مقارنة أسعار المنتجات الأولى' : 'Top Sample Products Pricing'}
          </span>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F2E', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="price" fill="#00D9FF" radius={[4, 4, 0, 0]} name={isAr ? 'السعر' : 'Price'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Pie Chart */}
        <div className="bg-[#0F1419] p-4 rounded-xl border border-[#1E293B] space-y-2 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#94A3B8] block">
            {isAr ? 'حالة التوفر بالمخزون' : 'Stock Availability Ratio'}
          </span>
          
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F2E', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs pt-2 border-t border-[#1E293B]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-[#E2E8F0]">{isAr ? 'متاح' : 'In Stock'} ({inStockCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-[#E2E8F0]">{isAr ? 'نفذت' : 'Out'} ({outOfStockCount})</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
