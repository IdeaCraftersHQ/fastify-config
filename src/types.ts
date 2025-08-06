import { FastifyPluginOptions, FastifyLoggerInstance } from 'fastify';
import { Redis } from 'ioredis';

export interface ConfigManager {
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
}

export interface StoreAdapter {
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  close?(): Promise<void>;
}

export interface FileStoreOptions {
  path?: string;
  pretty?: boolean;
}

export interface RedisStoreOptions {
  client?: Redis;
  prefix?: string;
}

export type StoreOptions = FileStoreOptions | RedisStoreOptions;

export interface DynamicConfigOptions extends FastifyPluginOptions {
  store?: 'memory' | 'file' | 'redis';
  options?: StoreOptions;
  logger?: FastifyLoggerInstance;
}

export class ConfigStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigStoreError';
  }
}

export class ConnectionError extends ConfigStoreError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class SerializationError extends ConfigStoreError {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}