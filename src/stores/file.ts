import { promises as fs } from 'fs';
import * as path from 'path';
import { StoreAdapter, FileStoreOptions, SerializationError, ConfigStoreError } from '../types';

export class FileStore implements StoreAdapter {
  private filePath: string;
  private pretty: boolean;
  private data: Map<string, any>;
  private writeQueue: Promise<void> = Promise.resolve();
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(options: FileStoreOptions = {}) {
    this.filePath = options.path || './config/dynamic.json';
    this.pretty = options.pretty ?? true;
    this.data = new Map();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    
    this.initPromise = this.performInitialization();
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await this.ensureFile();
      await this.loadFromFile();
      this.initialized = true;
    } finally {
      this.initPromise = null;
    }
  }

  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await this.saveToFile();
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content || '{}');
      this.data = new Map(Object.entries(parsed));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new ConfigStoreError(`Failed to load config file: ${error}`);
      }
      this.data = new Map();
    }
  }

  private async saveToFile(): Promise<void> {
    const obj = Object.fromEntries(this.data);
    const content = this.pretty 
      ? JSON.stringify(obj, null, 2)
      : JSON.stringify(obj);
    
    const tempFile = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(7)}`;
    await fs.writeFile(tempFile, content, 'utf-8');
    await fs.rename(tempFile, this.filePath);
  }

  private queueWrite(): Promise<void> {
    this.writeQueue = this.writeQueue.then(() => this.saveToFile()).catch(error => {
      console.error(`Failed to write to file: ${error}`);
    });
    return this.writeQueue;
  }

  async get(key: string): Promise<any | null> {
    await this.initialize();
    const value = this.data.get(key);
    return value !== undefined ? value : null;
  }

  async set(key: string, value: any): Promise<boolean> {
    await this.initialize();
    
    try {
      JSON.stringify(value);
    } catch (error) {
      throw new SerializationError(`Failed to serialize value for key "${key}": ${error}`);
    }
    
    this.data.set(key, value);
    await this.queueWrite();
    return true;
  }

  async delete(key: string): Promise<boolean> {
    await this.initialize();
    
    const result = this.data.delete(key);
    if (result) {
      await this.queueWrite();
    }
    return result;
  }

  async has(key: string): Promise<boolean> {
    await this.initialize();
    return this.data.has(key);
  }
}