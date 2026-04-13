declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): any[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }
  export interface Statement {
    bind(params?: any[]): void;
    step(): boolean;
    getAsObject(params?: any): Record<string, any>;
    run(params?: any[]): void;
    free(): void;
  }
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
}
