import { StoreAdapter, FileStoreOptions } from '../types';
export declare class FileStore implements StoreAdapter {
    private filePath;
    private pretty;
    private data;
    private writeQueue;
    private initialized;
    private initPromise;
    constructor(options?: FileStoreOptions);
    private initialize;
    private performInitialization;
    private ensureFile;
    private loadFromFile;
    private saveToFile;
    private queueWrite;
    get(key: string): Promise<any | null>;
    set(key: string, value: any): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
}
//# sourceMappingURL=file.d.ts.map