import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useScorecard } from '../../hooks/use-scorecard';

export function BeatMissBar() {
  const { data } = useScorecard();
  if (!data || data.totalReported === 0) return null;

  const chartData = [
    { name: 'EPS Beat', value: data.epsBeatCount, color: '#22c55e' },
    { name: 'EPS Meet', value: data.epsMeetCount, color: '#eab308' },
    { name: 'EPS Miss', value: data.epsMissCount, color: '#ef4444' },
    { name: 'Rev Beat', value: data.revBeatCount, color: '#22c55e' },
    { name: 'Rev Meet', value: data.revMeetCount, color: '#eab308' },
    { name: 'Rev Miss', value: data.revMissCount, color: '#ef4444' },
  ];

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Beat / Miss Distribution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #2a3548', borderRadius: '6px', fontSize: '12px' }}
            labelStyle={{ color: '#e2e8f0' }}
            itemStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
