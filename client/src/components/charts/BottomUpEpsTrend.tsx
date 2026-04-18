import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TracedValue } from '../../hooks/use-canonical';

interface Point {
  period: string;
  eps: TracedValue;
}

export function BottomUpEpsTrend({ series }: { series: Point[] }) {
  const data = series
    .filter((p) => p.eps.value !== null)
    .map((p) => ({ period: p.period, eps: p.eps.value as number }));

  if (data.length === 0) {
    return <p className="text-[11px] text-text-muted text-center py-8">No EPS series data available.</p>;
  }

  return (
    <>
      <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
        Bottom-Up EPS by Quarter
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #2a3548',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'EPS']}
          />
          <Line
            type="monotone"
            dataKey="eps"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
