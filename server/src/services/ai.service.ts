import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.ts';
import { computeScorecard } from './scorecard.service.ts';
import { getDb } from '../db/connection.ts';

function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

async function getReportedEarnings() {
  const db = await getDb();
  return queryAll(db,
    `SELECT e.*, c.ticker, c.name, c.sector, c.region, c.industry
     FROM earnings_reports e JOIN companies c ON e.company_id = c.id
     WHERE e.status = 'reported' ORDER BY e.report_date DESC`);
}

async function getCommentaryData() {
  const db = await getDb();
  return queryAll(db,
    `SELECT cm.*, c.ticker, c.name, c.sector
     FROM commentary cm JOIN companies c ON cm.company_id = c.id
     ORDER BY c.ticker`);
}

function buildPrompt(type: string, scorecard: any, earnings: any[], commentary: any[]): string {
  const scorecardSummary = `
Season: ${scorecard.quarter}
Companies tracked: ${scorecard.totalCompanies}, Reported: ${scorecard.totalReported} (${scorecard.pctReported.toFixed(1)}%)
EPS Beat Rate: ${scorecard.pctBeatingEps.toFixed(0)}% (${scorecard.epsBeatCount} beats, ${scorecard.epsMissCount} misses, ${scorecard.epsMeetCount} meets)
Revenue Beat Rate: ${scorecard.pctBeatingRev.toFixed(0)}% (${scorecard.revBeatCount} beats)
Avg EPS Surprise: ${scorecard.avgEpsSurprisePct.toFixed(1)}%, Avg Rev Surprise: ${scorecard.avgRevSurprisePct.toFixed(1)}%
Avg Stock Reaction: ${scorecard.avgStockReaction.toFixed(1)}%
Guidance: ${scorecard.guidanceRaisedCount} raised, ${scorecard.guidanceLoweredCount} lowered`.trim();

  const sectorTable = scorecard.bySector
    .filter((s: any) => s.reportedCompanies > 0)
    .map((s: any) => `${s.sector}: ${s.reportedCompanies} reported, EPS beat ${s.pctBeatingEps.toFixed(0)}%, avg surprise ${s.avgEpsSurprisePct.toFixed(1)}%, avg rxn ${s.avgStockReaction.toFixed(1)}%`)
    .join('\n');

  const earningsTable = earnings.map(e =>
    `${e.ticker} (${e.name}, ${e.sector}): EPS $${e.eps_actual} vs $${e.eps_estimate} (${e.eps_surprise_pct > 0 ? '+' : ''}${e.eps_surprise_pct}%), Rev $${(e.revenue_actual / 1e9).toFixed(1)}B vs $${(e.revenue_estimate / 1e9).toFixed(1)}B (${e.revenue_surprise_pct > 0 ? '+' : ''}${e.revenue_surprise_pct}%), Guidance: ${e.guidance_direction || 'N/A'}, Stock: ${e.stock_reaction_pct > 0 ? '+' : ''}${e.stock_reaction_pct}%`
  ).join('\n');

  const commentaryList = commentary.map(c =>
    `${c.ticker} (${c.sector}): "${c.quote_text}" [sentiment: ${c.sentiment}, themes: ${c.theme_tags}]`
  ).join('\n');

  const prompts: Record<string, string> = {
    overview: `You are a senior equity research analyst. Provide a comprehensive overview of the Q1 2026 earnings season so far.

DATA:
${scorecardSummary}

SECTOR BREAKDOWN:
${sectorTable}

INDIVIDUAL RESULTS:
${earningsTable}

Write a professional analysis covering:
1. Overall season health and beat rates vs historical norms
2. Notable standouts (best/worst surprises)
3. Market reaction patterns
4. What the early results signal for the rest of the season
Keep it concise but insightful. Use specific numbers.`,

    sectors: `You are a senior equity research analyst. Provide a deep sector-by-sector analysis of Q1 2026 earnings.

SCORECARD:
${scorecardSummary}

SECTOR BREAKDOWN:
${sectorTable}

INDIVIDUAL RESULTS:
${earningsTable}

For each sector with reported results, analyze:
1. Beat/miss patterns and surprise magnitudes
2. Key drivers behind the results
3. How the sector's results compare to expectations
4. Stock market reactions and what they signal
5. Outlook for remaining reporters in the sector`,

    guidance: `You are a senior equity research analyst. Analyze forward guidance signals from Q1 2026 earnings.

SCORECARD:
${scorecardSummary}

INDIVIDUAL RESULTS:
${earningsTable}

MANAGEMENT COMMENTARY:
${commentaryList}

Analyze:
1. Guidance trends (raised vs maintained vs lowered)
2. What guidance signals about economic outlook
3. Companies showing the most confidence/caution
4. Key risks and opportunities flagged in guidance
5. How stock reactions correlate with guidance direction`,

    themes: `You are a senior equity research analyst. Extract and analyze key themes from Q1 2026 earnings commentary.

MANAGEMENT COMMENTARY:
${commentaryList}

INDIVIDUAL RESULTS:
${earningsTable}

Identify and analyze the dominant themes:
1. AI/cloud capex trends and investment signals
2. Tariff and trade war impacts
3. Consumer health indicators
4. Margin trends and cost management
5. China exposure and geopolitical risks
6. Any other emerging themes

For each theme, cite specific companies and quotes. Assess whether the theme is bullish or bearish.`,
  };

  return prompts[type] || prompts.overview;
}

export async function* streamAnalysis(type: string): AsyncGenerator<string> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured. Add it to your .env file.');
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const [scorecard, earnings, commentary] = await Promise.all([
    computeScorecard('Q1 2026'),
    getReportedEarnings(),
    getCommentaryData(),
  ]);

  const prompt = buildPrompt(type, scorecard, earnings, commentary);

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
