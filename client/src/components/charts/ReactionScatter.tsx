import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useEarnings } from '../../hooks/use-earnings';
import { SECTOR_COLORS } from '../../lib/constants';
import { Spinner } from '../ui/Spinner';

export function ReactionScatter() {
  const { data, isLoading } = useEarnings({ status: 'reported' });

  if (isLoading) return <Spinner size="sm" />;

  const chartData = (data || [])
    .filter(e => e.eps_surprise_pct !== null && e.stock_reaction_pct !== null)
    .map(e => ({
      x: e.eps_surprise_pct,
      y: e.stock_reaction_pct,
      ticker: e.ticker,
      sector: e.sector,
      fill: SECTOR_COLORS[e.sector] || '#666',
    }));

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center text-text-muted text-sm">
        Not enough data for scatter plot
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">EPS Surprise vs Stock Reaction</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
          <XAxis
            type="number"
            dataKey="x"
            name="EPS Surprise %"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#2a3548' }}
            tickLine={false}
            label={{ value: 'EPS Surprise %', position: 'bottom', fill: '#64748b', fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Stock Reaction %"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#2a3548' }}
            tickLine={false}
            label={{ value: 'Stock Rxn %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
          />
          <ReferenceLine x={0} stroke="#2a3548" />
          <ReferenceLine y={0} stroke="#2a3548" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #2a3548', borderRadius: '6px', fontSize: '12px' }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            labelFormatter={(_, payload) => {
              if (payload?.[0]?.payload?.ticker) return payload[0].payload.ticker;
              return '';
            }}
          />
          <Scatter data={chartData} fill="#3b82f6" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
