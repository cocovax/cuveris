import { createPostgresAdapters } from './providers/postgres';
import { type DataContext } from './interfaces';
export declare let postgresAdapters: ReturnType<typeof createPostgresAdapters> | undefined;
export declare const getDataContext: () => DataContext;
export declare const resetDataContext: () => void;
//# sourceMappingURL=dataContext.d.ts.map