import { StoreAdapter } from '../types';
export declare class MemoryStore implements StoreAdapter {
    private store;
    constructor();
    get(key: string): Promise<any | null>;
    set(key: string, value: any): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
}
//# sourceMappingURL=memory.d.ts.map