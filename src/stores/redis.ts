import { StoreAdapter, RedisStoreOptions, ConnectionError, SerializationError } from '../types';
import type { Redis } from 'ioredis';

export class RedisStore implements StoreAdapter {
  private client: Redis;
  private prefix: string;

  constructor(options: RedisStoreOptions = {}) {
    if (!options.client) {
      throw new ConnectionError('Redis client is required for RedisStore');
    }
    
    this.client = options.client;
    this.prefix = options.prefix || 'config:';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<any | null> {
    try {
      const value = await this.client.get(this.getKey(key));
      if (value === null) {
        return null;
      }
      
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new SerializationError(`Failed to deserialize value for key "${key}": ${error}`);
      }
    } catch (error) {
      if (error instanceof SerializationError) {
        throw error;
      }
      throw new ConnectionError(`Failed to get key "${key}": ${error}`);
    }
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const result = await this.client.set(this.getKey(key), serialized);
      return result === 'OK';
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof TypeError) {
        throw new SerializationError(`Failed to serialize value for key "${key}": ${error}`);
      }
      throw new ConnectionError(`Failed to set key "${key}": ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      throw new ConnectionError(`Failed to delete key "${key}": ${error}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      throw new ConnectionError(`Failed to check key "${key}": ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.client && typeof this.client.quit === 'function') {
      await this.client.quit();
    }
  }
}