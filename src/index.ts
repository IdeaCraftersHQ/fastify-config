import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { DynamicConfigOptions, StoreAdapter, ConfigManager, FileStoreOptions, RedisStoreOptions } from './types';
import { MemoryStore } from './stores/memory';
import { FileStore } from './stores/file';
import { RedisStore } from './stores/redis';
import { ConfigManagerImpl } from './config-manager';

declare module 'fastify' {
  interface FastifyInstance {
    config: ConfigManager;
  }
}

async function fastifyDynamicConfig(
  fastify: FastifyInstance,
  options: DynamicConfigOptions
): Promise<void> {
  const logger = options.logger || fastify.log;
  const storeType = options.store || 'memory';
  
  logger.info({ store: storeType }, 'Initializing fastify-config plugin');
  
  let store: StoreAdapter;
  
  switch (storeType) {
    case 'memory':
      store = new MemoryStore();
      break;
    
    case 'file':
      store = new FileStore(options.options as FileStoreOptions);
      break;
    
    case 'redis':
      store = new RedisStore(options.options as RedisStoreOptions);
      break;
    
    default:
      throw new Error(`Unknown store type: ${storeType}`);
  }
  
  const configManager = new ConfigManagerImpl(store, logger);
  
  fastify.decorate('config', configManager);
  
  fastify.addHook('onClose', async () => {
    if (store.close) {
      await store.close();
    }
  });
  
  logger.info({ store: storeType }, 'fastify-config plugin initialized');
}

export default fp(fastifyDynamicConfig, {
  fastify: '4.x',
  name: 'fastify-config'
});

export * from './types';