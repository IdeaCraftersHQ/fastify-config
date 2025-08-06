import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from '../src/stores/memory';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe('set and get', () => {
    it('should store and retrieve string values', async () => {
      await store.set('key1', 'value1');
      const value = await store.get('key1');
      expect(value).toBe('value1');
    });

    it('should store and retrieve number values', async () => {
      await store.set('count', 42);
      const value = await store.get('count');
      expect(value).toBe(42);
    });

    it('should store and retrieve boolean values', async () => {
      await store.set('enabled', true);
      const value = await store.get('enabled');
      expect(value).toBe(true);
    });

    it('should store and retrieve null values', async () => {
      await store.set('nullable', null);
      const value = await store.get('nullable');
      expect(value).toBe(null);
    });

    it('should store and retrieve object values', async () => {
      const obj = { name: 'test', age: 30, nested: { value: true } };
      await store.set('user', obj);
      const value = await store.get('user');
      expect(value).toEqual(obj);
    });

    it('should store and retrieve array values', async () => {
      const arr = [1, 'two', { three: 3 }, [4, 5]];
      await store.set('list', arr);
      const value = await store.get('list');
      expect(value).toEqual(arr);
    });

    it('should return null for non-existent keys', async () => {
      const value = await store.get('nonexistent');
      expect(value).toBe(null);
    });

    it('should overwrite existing values', async () => {
      await store.set('key', 'value1');
      await store.set('key', 'value2');
      const value = await store.get('key');
      expect(value).toBe('value2');
    });
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      await store.set('key', 'value');
      const result = await store.delete('key');
      expect(result).toBe(true);
      const value = await store.get('key');
      expect(value).toBe(null);
    });

    it('should return false when deleting non-existent keys', async () => {
      const result = await store.delete('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', async () => {
      await store.set('key', 'value');
      const result = await store.has('key');
      expect(result).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const result = await store.has('nonexistent');
      expect(result).toBe(false);
    });

    it('should work with null values', async () => {
      await store.set('nullable', null);
      const result = await store.has('nullable');
      expect(result).toBe(true);
    });
  });

  describe('namespace support', () => {
    it('should handle dot notation keys', async () => {
      await store.set('api.rateLimit', 100);
      await store.set('api.timeout', 5000);
      
      const rateLimit = await store.get('api.rateLimit');
      const timeout = await store.get('api.timeout');
      
      expect(rateLimit).toBe(100);
      expect(timeout).toBe(5000);
    });

    it('should keep namespaced keys separate', async () => {
      await store.set('api', { global: true });
      await store.set('api.rateLimit', 100);
      
      const api = await store.get('api');
      const rateLimit = await store.get('api.rateLimit');
      
      expect(api).toEqual({ global: true });
      expect(rateLimit).toBe(100);
    });
  });

  describe('error handling', () => {
    it('should throw SerializationError for circular references', async () => {
      const obj: any = { name: 'test' };
      obj.circular = obj;
      
      await expect(store.set('circular', obj)).rejects.toThrow('Failed to serialize');
    });
  });
});