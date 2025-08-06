"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStore = void 0;
const types_1 = require("../types");
class RedisStore {
    client;
    prefix;
    constructor(options = {}) {
        if (!options.client) {
            throw new types_1.ConnectionError('Redis client is required for RedisStore');
        }
        this.client = options.client;
        this.prefix = options.prefix || 'config:';
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    async get(key) {
        try {
            const value = await this.client.get(this.getKey(key));
            if (value === null) {
                return null;
            }
            try {
                return JSON.parse(value);
            }
            catch (error) {
                throw new types_1.SerializationError(`Failed to deserialize value for key "${key}": ${error}`);
            }
        }
        catch (error) {
            if (error instanceof types_1.SerializationError) {
                throw error;
            }
            throw new types_1.ConnectionError(`Failed to get key "${key}": ${error}`);
        }
    }
    async set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            const result = await this.client.set(this.getKey(key), serialized);
            return result === 'OK';
        }
        catch (error) {
            if (error instanceof SyntaxError || error instanceof TypeError) {
                throw new types_1.SerializationError(`Failed to serialize value for key "${key}": ${error}`);
            }
            throw new types_1.ConnectionError(`Failed to set key "${key}": ${error}`);
        }
    }
    async delete(key) {
        try {
            const result = await this.client.del(this.getKey(key));
            return result > 0;
        }
        catch (error) {
            throw new types_1.ConnectionError(`Failed to delete key "${key}": ${error}`);
        }
    }
    async has(key) {
        try {
            const result = await this.client.exists(this.getKey(key));
            return result === 1;
        }
        catch (error) {
            throw new types_1.ConnectionError(`Failed to check key "${key}": ${error}`);
        }
    }
    async close() {
        if (this.client && typeof this.client.quit === 'function') {
            await this.client.quit();
        }
    }
}
exports.RedisStore = RedisStore;
//# sourceMappingURL=redis.js.map