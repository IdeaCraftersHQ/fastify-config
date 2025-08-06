import Fastify from 'fastify';
import fastifyConfig from '@ideacrafters/fastify-config';
import { promises as fs } from 'fs';

const CONFIG_FILE = './config/app-config.json';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register the config plugin with file store
await fastify.register(fastifyConfig, {
  store: 'file',
  options: {
    path: CONFIG_FILE,
    pretty: true  // Make the JSON file human-readable
  }
});

async function seedConfiguration() {
  console.log('\n=== Seeding Configuration ===\n');
  
  // Application settings
  await fastify.config.set('app.name', 'File Store Example');
  await fastify.config.set('app.version', '1.0.0');
  await fastify.config.set('app.environment', 'development');
  
  // Feature flags
  await fastify.config.set('features.betaUI', false);
  await fastify.config.set('features.analytics', true);
  await fastify.config.set('features.newsletter', true);
  
  // API settings
  await fastify.config.set('api.rateLimit.enabled', true);
  await fastify.config.set('api.rateLimit.maxRequests', 100);
  await fastify.config.set('api.rateLimit.windowMs', 60000);
  
  // Database configuration
  await fastify.config.set('database.connections.max', 10);
  await fastify.config.set('database.connections.min', 2);
  await fastify.config.set('database.timeout', 30000);
  
  console.log('Configuration seeded successfully');
  console.log(`Check the file at: ${CONFIG_FILE}`);
}

async function displayFileContents() {
  console.log('\n=== Current File Contents ===\n');
  
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    console.log(content);
  } catch (error) {
    console.log('Config file not found yet');
  }
}

async function demonstratePersistence() {
  console.log('\n=== Demonstrating Persistence ===\n');
  
  // Set some values
  await fastify.config.set('session.id', 'abc123');
  await fastify.config.set('session.timestamp', new Date().toISOString());
  
  console.log('Values set in this instance');
  
  // Create a new store instance pointing to the same file
  const Fastify2 = (await import('fastify')).default;
  const fastify2 = Fastify2({ logger: false });
  
  await fastify2.register((await import('@ideacrafters/fastify-config')).default, {
    store: 'file',
    options: {
      path: CONFIG_FILE,
      pretty: true
    }
  });
  
  // Read values from the new instance
  const sessionId = await fastify2.config.get('session.id');
  const timestamp = await fastify2.config.get('session.timestamp');
  
  console.log('Values read from new instance:');
  console.log('  Session ID:', sessionId);
  console.log('  Timestamp:', timestamp);
  
  await fastify2.close();
}

async function setupAdminRoutes() {
  // Admin route to view all config
  fastify.get('/admin/config', async (request, reply) => {
    try {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to read config file' });
    }
  });
  
  // Admin route to update config
  fastify.put('/admin/config/:key', async (request, reply) => {
    const { key } = request.params;
    const { value } = request.body;
    
    await fastify.config.set(key, value);
    
    // Show updated file contents
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    
    return {
      success: true,
      key,
      value,
      fileContents: JSON.parse(content)
    };
  });
  
  // Feature flag route
  fastify.get('/features/:flag', async (request, reply) => {
    const { flag } = request.params;
    const key = `features.${flag}`;
    
    const enabled = await fastify.config.get(key);
    
    if (enabled === null) {
      return reply.code(404).send({ error: 'Feature flag not found' });
    }
    
    return {
      feature: flag,
      enabled
    };
  });
  
  // Toggle feature flag
  fastify.post('/features/:flag/toggle', async (request, reply) => {
    const { flag } = request.params;
    const key = `features.${flag}`;
    
    const current = await fastify.config.get(key);
    
    if (current === null) {
      return reply.code(404).send({ error: 'Feature flag not found' });
    }
    
    const newValue = !current;
    await fastify.config.set(key, newValue);
    
    return {
      feature: flag,
      previousValue: current,
      newValue
    };
  });
}

// Cleanup function
async function cleanup() {
  console.log('\n=== Cleanup ===\n');
  
  const shouldClean = process.argv.includes('--clean');
  
  if (shouldClean) {
    try {
      await fs.unlink(CONFIG_FILE);
      await fs.rmdir('./config');
      console.log('Config file and directory removed');
    } catch (error) {
      console.log('Nothing to clean');
    }
  } else {
    console.log('Config file preserved at:', CONFIG_FILE);
    console.log('Run with --clean to remove the config file');
  }
}

async function main() {
  try {
    await displayFileContents();
    await seedConfiguration();
    await displayFileContents();
    await demonstratePersistence();
    await setupAdminRoutes();
    
    await fastify.listen({ port: 3001 });
    
    console.log('\n=== Server Running on Port 3001 ===');
    console.log('\nTry these endpoints:');
    console.log('GET  http://localhost:3001/admin/config');
    console.log('GET  http://localhost:3001/features/betaUI');
    console.log('POST http://localhost:3001/features/betaUI/toggle');
    console.log('PUT  http://localhost:3001/admin/config/app.environment');
    console.log('     Body: { "value": "production" }');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await fastify.close();
      await cleanup();
      process.exit(0);
    });
    
  } catch (err) {
    fastify.log.error(err);
    await cleanup();
    process.exit(1);
  }
}

main();