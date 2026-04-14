import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useScorecard } from '../../hooks/use-scorecard';
import { SECTOR_COLORS } from '../../lib/constants';

export function GrowthBySector() {
  const { data } = useScorecard();
  if (!data) return null;

  const chartData = data.bySector
    .filter(s => s.reportedCompanies > 0 && s.avgEpsGrowthYoy !== 0)
    .map(s => ({
      sector: s.sector.replace('Consumer ', 'Cons. ').replace('Communication ', 'Comm. '),
      fullSector: s.sector,
      value: parseFloat(s.avgEpsGrowthYoy.toFixed(1)),
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">YoY EPS Growth by Sector</h3>
        <p className="text-[11px] text-text-muted text-center py-8">No growth data available yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">YoY EPS Growth by Sector</h3>
      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 28)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="sector"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <ReferenceLine x={0} stroke="#2a3548" />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #2a3548', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'YoY EPS Growth']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullSector || label}
          />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={18}>
            {chartData.map((entry) => (
              <Cell
                key={entry.fullSector}
                fill={entry.value >= 0 ? (SECTOR_COLORS[entry.fullSector] || '#22c55e') : '#ef4444'}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
