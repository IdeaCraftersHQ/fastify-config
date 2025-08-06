import { ConfigManager, StoreAdapter } from './types';
import { FastifyLoggerInstance } from 'fastify';
export declare class ConfigManagerImpl implements ConfigManager {
    private store;
    private logger?;
    constructor(store: StoreAdapter, logger?: FastifyLoggerInstance);
    get(key: string): Promise<any | null>;
    set(key: string, value: any): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
}
//# sourceMappingURL=config-manager.d.ts.map