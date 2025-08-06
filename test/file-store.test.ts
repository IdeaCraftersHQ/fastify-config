import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileStore } from '../src/stores/file';

describe('FileStore', () => {
  const testFilePath = './test-config.json';
  let store: FileStore;

  beforeEach(async () => {
    store = new FileStore({ path: testFilePath, pretty: false });
    try {
      await fs.unlink(testFilePath);
    } catch {
      // File doesn't exist, which is fine
    }
  });

  afterEach(async () => {
    try {
      await fs.unlink(testFilePath);
    } catch {
      // Cleanup, ignore if doesn't exist
    }
  });

  describe('file operations', () => {
    it('should create file if it does not exist', async () => {
      await store.set('key', 'value');
      const exists = await fs.access(testFilePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create directory structure if needed', async () => {
      const nestedPath = './test-dir/nested/config.json';
      const nestedStore = new FileStore({ path: nestedPath });
      
      await nestedStore.set('key', 'value');
      const exists = await fs.access(nestedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      // Cleanup
      await fs.rm('./test-dir', { recursive: true, force: true });
    });

    it('should persist data across instances', async () => {
      await store.set('persistent', 'data');
      
      const newStore = new FileStore({ path: testFilePath });
      const value = await newStore.get('persistent');
      expect(value).toBe('data');
    });

    it('should write pretty JSON when enabled', async () => {
      const prettyStore = new FileStore({ path: testFilePath, pretty: true });
      await prettyStore.set('key', { nested: 'value' });
      
      const content = await fs.readFile(testFilePath, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await store.set('key1', 'value1');
      const value = await store.get('key1');
      expect(value).toBe('value1');
    });

    it('should handle complex objects', async () => {
      const obj = { 
        name: 'test', 
        settings: { 
          enabled: true, 
          count: 42 
        },
        list: [1, 2, 3]
      };
      await store.set('complex', obj);
      const value = await store.get('complex');
      expect(value).toEqual(obj);
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

    it('should persist deletion', async () => {
      await store.set('key', 'value');
      await store.delete('key');
      
      const newStore = new FileStore({ path: testFilePath });
      const value = await newStore.get('key');
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
  });

  describe('concurrent operations', () => {
    it('should handle concurrent writes', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(store.set(`key${i}`, `value${i}`));
      }
      await Promise.all(promises);
      
      for (let i = 0; i < 10; i++) {
        const value = await store.get(`key${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    it('should maintain data integrity during concurrent operations', async () => {
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(store.set(`set${i}`, i));
        operations.push(store.get(`set${i}`));
        operations.push(store.has(`set${i}`));
      }
      
      await Promise.all(operations);
      
      for (let i = 0; i < 5; i++) {
        const value = await store.get(`set${i}`);
        expect(value).toBe(i);
      }
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