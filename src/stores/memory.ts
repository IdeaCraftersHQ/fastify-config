import { StoreAdapter, SerializationError } from '../types';

export class MemoryStore implements StoreAdapter {
  private store: Map<string, string>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<any | null> {
    const value = this.store.get(key);
    if (value === undefined) {
      return null;
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new SerializationError(`Failed to deserialize value for key "${key}": ${error}`);
    }
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      this.store.set(key, serialized);
      return true;
    } catch (error) {
      throw new SerializationError(`Failed to serialize value for key "${key}": ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}