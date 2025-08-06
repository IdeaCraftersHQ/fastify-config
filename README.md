# @ideacrafters/fastify-config

Dynamic configuration management plugin for Fastify applications. Manage runtime configuration without server restarts.

[![npm version](https://badge.fury.io/js/%40ideacrafters%2Ffastify-config.svg)](https://www.npmjs.com/package/@ideacrafters/fastify-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multiple Storage Backends**: Memory, File, and Redis support
- **Simple API**: Consistent interface across all storage types
- **TypeScript Support**: Full type definitions included
- **Zero Dependencies**: Only requires fastify-plugin
- **Production Ready**: Comprehensive error handling and logging
- **Namespace Support**: Organize configs with dot notation
- **Fastify 4 & 5 Compatible**: Works with both current and next major versions

## Installation

```bash
npm install @ideacrafters/fastify-config
# or
yarn add @ideacrafters/fastify-config
# or
pnpm add @ideacrafters/fastify-config
```

For Redis support:
```bash
npm install ioredis
```

## Quick Start

```javascript
import Fastify from 'fastify';
import fastifyConfig from '@ideacrafters/fastify-config';

const fastify = Fastify();

// Register with default memory store
await fastify.register(fastifyConfig);

// Set configuration values
await fastify.config.set('api.rateLimit', 100);
await fastify.config.set('features.darkMode', true);

// Get configuration values
const rateLimit = await fastify.config.get('api.rateLimit'); // 100
const darkMode = await fastify.config.get('features.darkMode'); // true

// Check existence
const exists = await fastify.config.has('api.rateLimit'); // true

// Delete configuration
await fastify.config.delete('features.darkMode');
```

## Storage Backends

### Memory Store (Default)

Best for development and testing. Data is lost on restart.

```javascript
await fastify.register(fastifyConfig);
// or explicitly
await fastify.register(fastifyConfig, {
  store: 'memory'
});
```

### File Store

Persists configuration to a JSON file. Great for small applications.

```javascript
await fastify.register(fastifyConfig, {
  store: 'file',
  options: {
    path: './config/dynamic.json',
    pretty: true  // Format JSON with indentation
  }
});
```

### Redis Store

For production applications and distributed systems.

```javascript
import Redis from 'ioredis';

const redisClient = new Redis({
  host: 'localhost',
  port: 6379
});

await fastify.register(fastifyConfig, {
  store: 'redis',
  options: {
    client: redisClient,
    prefix: 'myapp:config:'  // Key prefix in Redis
  }
});
```

## API Reference

### `fastify.config.set(key: string, value: any): Promise<boolean>`

Set a configuration value. Values are automatically JSON serialized.

```javascript
await fastify.config.set('timeout', 5000);
await fastify.config.set('user', { name: 'John', role: 'admin' });
```

### `fastify.config.get(key: string): Promise<any | null>`

Get a configuration value. Returns `null` if key doesn't exist.

```javascript
const timeout = await fastify.config.get('timeout');
const user = await fastify.config.get('user');
```

### `fastify.config.delete(key: string): Promise<boolean>`

Delete a configuration value. Returns `true` if deleted, `false` if key didn't exist.

```javascript
const deleted = await fastify.config.delete('timeout');
```

### `fastify.config.has(key: string): Promise<boolean>`

Check if a configuration key exists.

```javascript
const exists = await fastify.config.has('timeout');
```

## Namespace Support

Use dot notation to organize configuration hierarchically:

```javascript
// Set nested configurations
await fastify.config.set('database.host', 'localhost');
await fastify.config.set('database.port', 5432);
await fastify.config.set('database.credentials.user', 'admin');

// Get nested values
const host = await fastify.config.get('database.host');
const port = await fastify.config.get('database.port');
```

Note: Namespaces are stored as flat keys with dots, not nested objects.

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import fastifyConfig, { DynamicConfigOptions } from '@ideacrafters/fastify-config';

const options: DynamicConfigOptions = {
  store: 'file',
  options: {
    path: './config.json',
    pretty: true
  }
};

await fastify.register(fastifyConfig, options);

// TypeScript knows about the config decorator
const value: any = await fastify.config.get('key');
```

## Error Handling

The plugin provides three error types:

- `ConfigStoreError`: Base error class for all configuration errors
- `ConnectionError`: Store connection issues
- `SerializationError`: JSON serialization/deserialization failures

```javascript
import { SerializationError, ConnectionError } from '@ideacrafters/fastify-config';

try {
  await fastify.config.set('key', circularObject);
} catch (error) {
  if (error instanceof SerializationError) {
    console.error('Failed to serialize value');
  } else if (error instanceof ConnectionError) {
    console.error('Store connection failed');
  }
}
```

## Examples

### Feature Flags

```javascript
// Enable/disable features at runtime
await fastify.config.set('features.newUI', false);

// In your route handler
fastify.get('/dashboard', async (request, reply) => {
  const useNewUI = await fastify.config.get('features.newUI');
  
  if (useNewUI) {
    return reply.view('dashboard-new');
  } else {
    return reply.view('dashboard-legacy');
  }
});
```

### Dynamic Rate Limiting

```javascript
// Update rate limits without restart
await fastify.config.set('rateLimit.requests', 100);
await fastify.config.set('rateLimit.window', 60000);

// In your rate limit middleware
const requests = await fastify.config.get('rateLimit.requests') || 100;
const window = await fastify.config.get('rateLimit.window') || 60000;
```

### Environment-Specific Configuration

```javascript
const store = process.env.NODE_ENV === 'production' ? 'redis' : 'file';

await fastify.register(fastifyConfig, {
  store,
  options: store === 'redis' 
    ? { client: redisClient, prefix: 'prod:' }
    : { path: './dev-config.json' }
});
```

## Migration from Static Config

Replace static configuration gradually:

```javascript
// Before: Static config file
const config = require('./config.json');
const timeout = config.api.timeout;

// After: Dynamic config
const timeout = await fastify.config.get('api.timeout') || 5000;
```

## Performance

- **Memory Store**: < 10ms for all operations
- **File Store**: < 100ms reads, < 200ms writes  
- **Redis Store**: < 50ms for simple operations

## Testing

```javascript
import { test } from 'tap';
import Fastify from 'fastify';
import fastifyConfig from '@ideacrafters/fastify-config';

test('config operations', async (t) => {
  const fastify = Fastify();
  await fastify.register(fastifyConfig);
  
  await fastify.config.set('test', 'value');
  const value = await fastify.config.get('test');
  
  t.equal(value, 'value');
  await fastify.close();
});
```

## License

MIT