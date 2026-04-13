import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';

export function AiInsightsPage() {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function runAnalysis(type: string) {
    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const res = await fetch(`/api/ai/analyze?type=${type}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Analysis failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              text += parsed.text || '';
              setAnalysis(text);
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to run analysis');
    } finally {
      setLoading(false);
    }
  }

  const analysisTypes = [
    { key: 'overview', label: 'Season Overview', desc: 'High-level analysis of Q1 2026 earnings so far' },
    { key: 'sectors', label: 'Sector Deep Dive', desc: 'Analyze performance across sectors' },
    { key: 'guidance', label: 'Guidance Analysis', desc: 'Review forward guidance signals' },
    { key: 'themes', label: 'Theme Extraction', desc: 'Extract key themes from commentary' },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-accent-purple" />
        <h2 className="text-lg font-semibold text-text-primary">AI Insights</h2>
      </div>

      <p className="text-sm text-text-muted mb-4">
        Powered by Claude Sonnet. Requires ANTHROPIC_API_KEY in server .env file.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {analysisTypes.map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => runAnalysis(key)}
            disabled={loading}
            className="bg-bg-card border border-border rounded-lg p-3 text-left hover:bg-bg-hover hover:border-accent-purple/30 transition-colors disabled:opacity-50"
          >
            <p className="text-sm font-medium text-text-primary">{label}</p>
            <p className="text-[10px] text-text-muted mt-1">{desc}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-accent-purple mb-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </div>
      )}

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap font-mono text-xs">
            {analysis}
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="bg-bg-card border border-border rounded-lg p-12 text-center">
          <Brain className="h-12 w-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-sm text-text-muted">Select an analysis type above to generate AI insights</p>
        </div>
      )}
    </div>
  );
}
