import Fastify from 'fastify';
import fastifyConfig from '@ideacrafters/fastify-config';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register the config plugin with memory store
await fastify.register(fastifyConfig);

// Basic configuration management
async function demonstrateBasicUsage() {
  console.log('\n=== Basic Configuration Operations ===\n');
  
  // Set simple values
  await fastify.config.set('appName', 'My Fastify App');
  await fastify.config.set('port', 3000);
  await fastify.config.set('debug', true);
  
  // Get values
  const appName = await fastify.config.get('appName');
  const port = await fastify.config.get('port');
  const debug = await fastify.config.get('debug');
  
  console.log('App Name:', appName);
  console.log('Port:', port);
  console.log('Debug:', debug);
  
  // Check existence
  const hasPort = await fastify.config.has('port');
  const hasUnknown = await fastify.config.has('unknown');
  
  console.log('\nHas "port" key:', hasPort);
  console.log('Has "unknown" key:', hasUnknown);
  
  // Delete a key
  await fastify.config.delete('debug');
  const debugAfterDelete = await fastify.config.get('debug');
  console.log('\nDebug after delete:', debugAfterDelete);
}

// Namespace configuration
async function demonstrateNamespaces() {
  console.log('\n=== Namespace Configuration ===\n');
  
  // Set namespaced values
  await fastify.config.set('api.rateLimit', 100);
  await fastify.config.set('api.timeout', 5000);
  await fastify.config.set('api.version', 'v1');
  
  await fastify.config.set('database.host', 'localhost');
  await fastify.config.set('database.port', 5432);
  await fastify.config.set('database.name', 'myapp');
  
  // Get namespaced values
  const rateLimit = await fastify.config.get('api.rateLimit');
  const dbHost = await fastify.config.get('database.host');
  
  console.log('API Rate Limit:', rateLimit);
  console.log('Database Host:', dbHost);
}

// Complex data structures
async function demonstrateComplexData() {
  console.log('\n=== Complex Data Structures ===\n');
  
  // Store an object
  const userSettings = {
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      push: false,
      sms: true
    },
    preferences: ['feature1', 'feature2', 'feature3']
  };
  
  await fastify.config.set('user.settings', userSettings);
  
  // Retrieve the object
  const retrieved = await fastify.config.get('user.settings');
  console.log('User Settings:', JSON.stringify(retrieved, null, 2));
  
  // Store an array
  const allowedOrigins = [
    'http://localhost:3000',
    'https://app.example.com',
    'https://api.example.com'
  ];
  
  await fastify.config.set('cors.origins', allowedOrigins);
  const origins = await fastify.config.get('cors.origins');
  console.log('\nCORS Origins:', origins);
}

// Practical route example
async function setupRoutes() {
  console.log('\n=== Route Example ===\n');
  
  // Configuration endpoint to get/set config values
  fastify.get('/config/:key', async (request, reply) => {
    const { key } = request.params;
    const value = await fastify.config.get(key);
    
    if (value === null) {
      return reply.code(404).send({ error: 'Configuration not found' });
    }
    
    return { key, value };
  });
  
  fastify.post('/config', async (request, reply) => {
    const { key, value } = request.body;
    
    if (!key) {
      return reply.code(400).send({ error: 'Key is required' });
    }
    
    await fastify.config.set(key, value);
    return { success: true, key, value };
  });
  
  fastify.delete('/config/:key', async (request, reply) => {
    const { key } = request.params;
    const deleted = await fastify.config.delete(key);
    
    return { success: deleted, key };
  });
}

// Run demonstrations
async function main() {
  try {
    await demonstrateBasicUsage();
    await demonstrateNamespaces();
    await demonstrateComplexData();
    await setupRoutes();
    
    // Start the server
    await fastify.listen({ port: 3000 });
    
    console.log('\n=== Server Running ===');
    console.log('Try these endpoints:');
    console.log('GET  http://localhost:3000/config/appName');
    console.log('POST http://localhost:3000/config');
    console.log('     Body: { "key": "test", "value": "hello" }');
    console.log('DELETE http://localhost:3000/config/test');
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();