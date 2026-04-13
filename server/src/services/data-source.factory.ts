import { config } from '../config.ts';
import type { DataSourceAdapter } from './data-source.interface.ts';
import { SeedAdapter } from './seed.adapter.ts';

let instance: DataSourceAdapter | null = null;

export function getDataSource(): DataSourceAdapter {
  if (!instance) {
    switch (config.dataSource) {
      case 'fmp':
        // FMP adapter - import dynamically when needed
        // For now, fall through to seed
        console.log('FMP adapter not yet configured, falling back to seed data');
        instance = new SeedAdapter();
        break;
      case 'finnhub':
        console.log('Finnhub adapter not yet configured, falling back to seed data');
        instance = new SeedAdapter();
        break;
      default:
        instance = new SeedAdapter();
    }
  }
  return instance;
}
