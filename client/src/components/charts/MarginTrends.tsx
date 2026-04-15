import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useScorecard } from '../../hooks/use-scorecard';

export function MarginTrends() {
  const { data } = useScorecard();
  if (!data) return null;

  const chartData = data.bySector
    .filter(s => s.reportedCompanies > 0 && s.avgGrossMargin > 0)
    .map(s => ({
      sector: s.sector.replace('Consumer ', 'Cons. ').replace('Communication ', 'Comm. '),
      current: parseFloat(s.avgGrossMargin.toFixed(1)),
      // Use real prior margin from seed data (populated after backfill); omit if unavailable
      prior: (s as any).avgGrossMarginPrior != null && (s as any).avgGrossMarginPrior > 0
        ? parseFloat(((s as any).avgGrossMarginPrior as number).toFixed(1))
        : null,
    }))
    .sort((a, b) => b.current - a.current);

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-3">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Gross Margin by Sector</h3>
        <p className="text-[11px] text-text-muted text-center py-8">No margin data available yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">Gross Margin by Sector</h3>
      <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 28)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
            domain={[0, 'auto']}
          />
          <YAxis
            type="category"
            dataKey="sector"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #2a3548', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'current' ? 'Current Q' : 'Prior Q']}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
            formatter={(value) => value === 'current' ? 'Current Q' : 'Prior Q'}
          />
          <Bar dataKey="current" fill="#3b82f6" fillOpacity={0.8} radius={[0, 3, 3, 0]} maxBarSize={14} />
          <Bar dataKey="prior" fill="#3b82f6" fillOpacity={0.3} radius={[0, 3, 3, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
