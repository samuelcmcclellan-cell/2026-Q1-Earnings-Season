import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  dataSource: (process.env.DATA_SOURCE || 'seed') as 'seed' | 'fmp' | 'finnhub',
  fmpApiKey: process.env.FMP_API_KEY || '',
  finnhubApiKey: process.env.FINNHUB_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  dbPath: path.resolve(__dirname, '../data/earnings.db'),
  seedDir: path.resolve(__dirname, '../data/seed'),
};
