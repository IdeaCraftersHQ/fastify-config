import { StoreAdapter, RedisStoreOptions } from '../types';
export declare class RedisStore implements StoreAdapter {
    private client;
    private prefix;
    constructor(options?: RedisStoreOptions);
    private getKey;
    get(key: string): Promise<any | null>;
    set(key: string, value: any): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
    close(): Promise<void>;
}
//# sourceMappingURL=redis.d.ts.map