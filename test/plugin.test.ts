import { describe, it, expect, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import fastifyDynamicConfig from '../src/index';
import { promises as fs } from 'fs';

describe('Fastify Plugin Integration', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify({ logger: false });
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('plugin registration', () => {
    it('should register with default memory store', async () => {
      await fastify.register(fastifyDynamicConfig);
      await fastify.ready();
      
      expect(fastify.config).toBeDefined();
      expect(typeof fastify.config.get).toBe('function');
      expect(typeof fastify.config.set).toBe('function');
      expect(typeof fastify.config.delete).toBe('function');
      expect(typeof fastify.config.has).toBe('function');
    });

    it('should register with file store', async () => {
      const testFile = './test-plugin-config.json';
      
      await fastify.register(fastifyDynamicConfig, {
        store: 'file',
        options: {
          path: testFile,
          pretty: true
        }
      });
      await fastify.ready();
      
      expect(fastify.config).toBeDefined();
      
      // Cleanup
      try {
        await fs.unlink(testFile);
      } catch {
        // Ignore
      }
    });

    it('should throw error for unknown store type', async () => {
      await expect(
        fastify.register(fastifyDynamicConfig, {
          store: 'unknown' as any
        })
      ).rejects.toThrow('Unknown store type');
    });
  });

  describe('config operations', () => {
    beforeEach(async () => {
      await fastify.register(fastifyDynamicConfig);
      await fastify.ready();
    });

    it('should perform basic CRUD operations', async () => {
      // Create
      const setResult = await fastify.config.set('test.key', 'test value');
      expect(setResult).toBe(true);
      
      // Read
      const value = await fastify.config.get('test.key');
      expect(value).toBe('test value');
      
      // Update
      await fastify.config.set('test.key', 'updated value');
      const updatedValue = await fastify.config.get('test.key');
      expect(updatedValue).toBe('updated value');
      
      // Delete
      const deleteResult = await fastify.config.delete('test.key');
      expect(deleteResult).toBe(true);
      const deletedValue = await fastify.config.get('test.key');
      expect(deletedValue).toBe(null);
    });

    it('should check key existence', async () => {
      await fastify.config.set('exists', true);
      
      const exists = await fastify.config.has('exists');
      const notExists = await fastify.config.has('notExists');
      
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should handle complex data types', async () => {
      const complexData = {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: {
          nested: {
            deep: 'value'
          }
        }
      };
      
      await fastify.config.set('complex', complexData);
      const retrieved = await fastify.config.get('complex');
      
      expect(retrieved).toEqual(complexData);
    });

    it('should handle namespace keys', async () => {
      await fastify.config.set('api.rateLimit', 100);
      await fastify.config.set('api.timeout', 5000);
      await fastify.config.set('api.enabled', true);
      
      const rateLimit = await fastify.config.get('api.rateLimit');
      const timeout = await fastify.config.get('api.timeout');
      const enabled = await fastify.config.get('api.enabled');
      
      expect(rateLimit).toBe(100);
      expect(timeout).toBe(5000);
      expect(enabled).toBe(true);
    });
  });

  describe('multiple instances', () => {
    it('should support multiple fastify instances with different stores', async () => {
      const fastify1 = Fastify({ logger: false });
      const fastify2 = Fastify({ logger: false });
      
      await fastify1.register(fastifyDynamicConfig, { store: 'memory' });
      await fastify2.register(fastifyDynamicConfig, { store: 'memory' });
      
      await fastify1.ready();
      await fastify2.ready();
      
      await fastify1.config.set('key', 'value1');
      await fastify2.config.set('key', 'value2');
      
      const value1 = await fastify1.config.get('key');
      const value2 = await fastify2.config.get('key');
      
      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      
      await fastify1.close();
      await fastify2.close();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await fastify.register(fastifyDynamicConfig);
      await fastify.ready();
    });

    it('should handle serialization errors gracefully', async () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      await expect(fastify.config.set('circular', circular)).rejects.toThrow();
    });
  });
});