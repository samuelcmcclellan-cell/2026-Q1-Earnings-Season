import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend } from 'recharts';
import { useScorecard } from '../../hooks/use-scorecard';
import { SECTOR_COLORS } from '../../lib/constants';

export function GrowthBySector() {
  const { data } = useScorecard();
  if (!data) return null;

  // Include ALL sectors that have either blended or expected data (not just reported)
  const chartData = data.bySector
    .filter(s => s.blendedEpsGrowthYoy !== 0 || s.expectedEpsGrowthYoy !== 0 || s.avgEpsGrowthYoy !== 0)
    .map(s => ({
      sector: s.sector.replace('Consumer ', 'Cons. ').replace('Communication ', 'Comm. '),
      fullSector: s.sector,
      // Blended = actuals for reported + estimates for upcoming (hero metric)
      blended: s.blendedEpsGrowthYoy !== 0 ? parseFloat(s.blendedEpsGrowthYoy.toFixed(1)) : null,
      // Expected = pure consensus estimates for all companies (benchmark)
      expected: s.expectedEpsGrowthYoy !== 0 ? parseFloat(s.expectedEpsGrowthYoy.toFixed(1)) : null,
      // Reported-only fallback when no prior-year data
      reported: s.reportedCompanies > 0 ? parseFloat(s.avgEpsGrowthYoy.toFixed(1)) : null,
      hasReported: s.reportedCompanies > 0,
      color: SECTOR_COLORS[s.sector] || '#64748b',
    }))
    .sort((a, b) => {
      const aVal = a.blended ?? a.expected ?? a.reported ?? 0;
      const bVal = b.blended ?? b.expected ?? b.reported ?? 0;
      return bVal - aVal;
    });

  const hasBlended = chartData.some(d => d.blended !== null);
  const hasExpected = chartData.some(d => d.expected !== null);

  // If no prior-year data yet, fall back to reported-only view
  if (!hasBlended && !hasExpected) {
    const fallback = chartData
      .filter(d => d.reported !== null)
      .sort((a, b) => (b.reported ?? 0) - (a.reported ?? 0));

    if (fallback.length === 0) {
      return (
        <div className="bg-bg-card border border-border rounded-lg p-3">
          <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">EPS Growth by Sector</h3>
          <p className="text-[11px] text-text-muted text-center py-8">No growth data available yet</p>
        </div>
      );
    }

    return (
      <div className="bg-bg-card border border-border rounded-lg p-3">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
          YoY EPS Growth by Sector <span className="text-accent-blue">(Reported Only)</span>
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(160, fallback.length * 28)}>
          <BarChart data={fallback} layout="vertical" margin={{ left: 80, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="sector" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
            <ReferenceLine x={0} stroke="#2a3548" />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #2a3548', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono' }} formatter={(v: number) => [`${v.toFixed(1)}%`, 'YoY EPS Growth']} labelFormatter={(l, p) => p?.[0]?.payload?.fullSector || l} />
            <Bar dataKey="reported" radius={[0, 3, 3, 0]} maxBarSize={18}>
              {fallback.map(entry => <Cell key={entry.fullSector} fill={(entry.reported ?? 0) >= 0 ? (entry.color) : '#ef4444'} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const height = Math.max(180, chartData.length * 34);

  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-medium text-text-muted uppercase tracking-wider">EPS Growth by Sector</h3>
        <div className="flex items-center gap-3 text-[9px] text-text-muted">
          {hasBlended && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Blended</span>}
          {hasExpected && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 opacity-30 inline-block" /> Expected</span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30, top: 0, bottom: 0 }} barCategoryGap="25%">
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
            formatter={(value: number, name: string) => [
              `${(value ?? 0).toFixed(1)}%`,
              name === 'blended' ? 'Blended (actuals + estimates)' : 'Expected (consensus estimates)',
            ]}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.fullSector || label}
          />

          {/* Expected bar: light/transparent — the pre-season benchmark */}
          {hasExpected && (
            <Bar dataKey="expected" radius={[0, 3, 3, 0]} maxBarSize={12} name="expected">
              {chartData.map(entry => (
                <Cell
                  key={`exp-${entry.fullSector}`}
                  fill={entry.color}
                  fillOpacity={0.25}
                />
              ))}
            </Bar>
          )}

          {/* Blended bar: solid — the live running aggregate */}
          {hasBlended && (
            <Bar dataKey="blended" radius={[0, 3, 3, 0]} maxBarSize={12} name="blended">
              {chartData.map(entry => (
                <Cell
                  key={`bln-${entry.fullSector}`}
                  fill={(entry.blended ?? 0) >= 0 ? entry.color : '#ef4444'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
