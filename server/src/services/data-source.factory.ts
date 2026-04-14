import { config } from '../config.ts';
import type { DataSourceAdapter } from './data-source.interface.ts';
import { SeedAdapter } from './seed.adapter.ts';
import { FmpAdapter } from './fmp.adapter.ts';
import { FinnhubAdapter } from './finnhub.adapter.ts';

let instance: DataSourceAdapter | null = null;

export function getDataSource(): DataSourceAdapter {
  if (!instance) {
    switch (config.dataSource) {
      case 'fmp':
        if (config.fmpApiKey) {
          instance = new FmpAdapter();
        } else {
          console.log('FMP API key not configured, falling back to seed data');
          instance = new SeedAdapter();
        }
        break;
      case 'finnhub':
        if (config.finnhubApiKey) {
          instance = new FinnhubAdapter();
        } else {
          console.log('Finnhub API key not configured, falling back to seed data');
          instance = new SeedAdapter();
        }
        break;
      default:
        instance = new SeedAdapter();
    }
  }
  return instance;
}
