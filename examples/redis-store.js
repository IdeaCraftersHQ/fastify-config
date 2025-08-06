import Fastify from 'fastify';
import fastifyConfig from '@ideacrafters/fastify-config';
import Redis from 'ioredis';

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Check Redis connection
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
  process.exit(1);
});

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register the config plugin with Redis store
await fastify.register(fastifyConfig, {
  store: 'redis',
  options: {
    client: redis,
    prefix: 'myapp:config:'  // All keys will be prefixed with this
  }
});

async function demonstrateRedisFeatures() {
  console.log('\n=== Redis Store Features ===\n');
  
  // Set various configuration values
  await fastify.config.set('app.name', 'Redis Store Example');
  await fastify.config.set('app.version', '2.0.0');
  await fastify.config.set('app.startTime', new Date().toISOString());
  
  // Complex object
  const serverConfig = {
    cluster: {
      enabled: true,
      workers: 4,
      restartOnFailure: true
    },
    monitoring: {
      metrics: ['cpu', 'memory', 'requests'],
      interval: 30000
    }
  };
  
  await fastify.config.set('server', serverConfig);
  
  console.log('Configuration stored in Redis');
  console.log('Keys are prefixed with: myapp:config:');
}

async function demonstrateDistributed() {
  console.log('\n=== Distributed Configuration ===\n');
  
  // Simulate another service connecting to the same Redis
  const fastify2 = Fastify({ logger: false });
  
  const redis2 = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
  
  await fastify2.register((await import('@ideacrafters/fastify-config')).default, {
    store: 'redis',
    options: {
      client: redis2,
      prefix: 'myapp:config:'  // Same prefix - shares configuration
    }
  });
  
  // Service 1 sets a value
  await fastify.config.set('shared.value', 'Set by Service 1');
  await fastify.config.set('shared.timestamp', Date.now());
  
  // Service 2 reads the value immediately
  const sharedValue = await fastify2.config.get('shared.value');
  const timestamp = await fastify2.config.get('shared.timestamp');
  
  console.log('Service 1 set:', 'Set by Service 1');
  console.log('Service 2 read:', sharedValue);
  console.log('Timestamp:', new Date(timestamp).toISOString());
  
  await fastify2.close();
  await redis2.quit();
}

async function setupCacheRoutes() {
  // Route to demonstrate cache-like behavior
  fastify.get('/cache/:key', async (request, reply) => {
    const { key } = request.params;
    const cacheKey = `cache.${key}`;
    
    // Check if cached
    let value = await fastify.config.get(cacheKey);
    
    if (value === null) {
      // Simulate expensive operation
      console.log(`Cache miss for ${key}, computing...`);
      value = {
        data: `Computed value for ${key}`,
        timestamp: new Date().toISOString(),
        computedIn: '2000ms'
      };
      
      // Store in cache
      await fastify.config.set(cacheKey, value);
      
      // Could also set TTL directly in Redis if needed
      // await redis.expire(`myapp:config:${cacheKey}`, 300);
    } else {
      console.log(`Cache hit for ${key}`);
    }
    
    return {
      key,
      cached: value !== null,
      value
    };
  });
  
  // Route to clear cache
  fastify.delete('/cache/:key', async (request, reply) => {
    const { key } = request.params;
    const cacheKey = `cache.${key}`;
    
    const deleted = await fastify.config.delete(cacheKey);
    
    return {
      key,
      deleted
    };
  });
  
  // Route to show all Redis keys (for debugging)
  fastify.get('/debug/keys', async (request, reply) => {
    const keys = await redis.keys('myapp:config:*');
    const values = {};
    
    for (const key of keys) {
      const cleanKey = key.replace('myapp:config:', '');
      const value = await fastify.config.get(cleanKey);
      values[cleanKey] = value;
    }
    
    return {
      prefix: 'myapp:config:',
      totalKeys: keys.length,
      keys: keys.map(k => k.replace('myapp:config:', '')),
      values
    };
  });
  
  // Health check that verifies Redis connection
  fastify.get('/health', async (request, reply) => {
    try {
      // Try to set and get a value
      const testKey = 'health.check';
      const testValue = Date.now();
      
      await fastify.config.set(testKey, testValue);
      const retrieved = await fastify.config.get(testKey);
      
      const healthy = retrieved === testValue;
      
      return {
        status: healthy ? 'healthy' : 'unhealthy',
        redis: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return reply.code(503).send({
        status: 'unhealthy',
        redis: 'disconnected',
        error: error.message
      });
    }
  });
}

async function demonstratePerformance() {
  console.log('\n=== Performance Test ===\n');
  
  const iterations = 1000;
  
  // Write performance
  console.log(`Writing ${iterations} keys...`);
  const writeStart = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await fastify.config.set(`perf.key${i}`, { index: i, data: 'test' });
  }
  
  const writeTime = Date.now() - writeStart;
  console.log(`Write time: ${writeTime}ms (${(writeTime/iterations).toFixed(2)}ms per operation)`);
  
  // Read performance
  console.log(`Reading ${iterations} keys...`);
  const readStart = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    await fastify.config.get(`perf.key${i}`);
  }
  
  const readTime = Date.now() - readStart;
  console.log(`Read time: ${readTime}ms (${(readTime/iterations).toFixed(2)}ms per operation)`);
  
  // Cleanup
  console.log('Cleaning up performance test keys...');
  for (let i = 0; i < iterations; i++) {
    await fastify.config.delete(`perf.key${i}`);
  }
}

async function cleanup() {
  console.log('\n=== Cleanup ===\n');
  
  if (process.argv.includes('--clean')) {
    // Clean all keys with our prefix
    const keys = await redis.keys('myapp:config:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Removed ${keys.length} keys from Redis`);
    } else {
      console.log('No keys to remove');
    }
  } else {
    const keys = await redis.keys('myapp:config:*');
    console.log(`${keys.length} keys remain in Redis`);
    console.log('Run with --clean to remove all keys');
  }
  
  await redis.quit();
}

async function main() {
  try {
    await demonstrateRedisFeatures();
    await demonstrateDistributed();
    await setupCacheRoutes();
    
    if (process.argv.includes('--perf')) {
      await demonstratePerformance();
    }
    
    await fastify.listen({ port: 3002 });
    
    console.log('\n=== Server Running on Port 3002 ===');
    console.log('\nTry these endpoints:');
    console.log('GET http://localhost:3002/health');
    console.log('GET http://localhost:3002/debug/keys');
    console.log('GET http://localhost:3002/cache/user123');
    console.log('DELETE http://localhost:3002/cache/user123');
    console.log('\nRun with --perf to include performance test');
    console.log('Run with --clean to remove all keys on shutdown');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await fastify.close();
      await cleanup();
      process.exit(0);
    });
    
  } catch (err) {
    console.error('Error:', err);
    await cleanup();
    process.exit(1);
  }
}

main();