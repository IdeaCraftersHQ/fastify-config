"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManagerImpl = void 0;
class ConfigManagerImpl {
    store;
    logger;
    constructor(store, logger) {
        this.store = store;
        this.logger = logger;
    }
    async get(key) {
        try {
            this.logger?.debug({ key }, 'Getting configuration value');
            const value = await this.store.get(key);
            this.logger?.debug({ key, value }, 'Configuration value retrieved');
            return value;
        }
        catch (error) {
            this.logger?.error({ key, error }, 'Failed to get configuration value');
            throw error;
        }
    }
    async set(key, value) {
        try {
            this.logger?.debug({ key, value }, 'Setting configuration value');
            const result = await this.store.set(key, value);
            this.logger?.debug({ key, result }, 'Configuration value set');
            return result;
        }
        catch (error) {
            this.logger?.error({ key, value, error }, 'Failed to set configuration value');
            throw error;
        }
    }
    async delete(key) {
        try {
            this.logger?.debug({ key }, 'Deleting configuration value');
            const result = await this.store.delete(key);
            this.logger?.debug({ key, result }, 'Configuration value deleted');
            return result;
        }
        catch (error) {
            this.logger?.error({ key, error }, 'Failed to delete configuration value');
            throw error;
        }
    }
    async has(key) {
        try {
            this.logger?.debug({ key }, 'Checking configuration value existence');
            const result = await this.store.has(key);
            this.logger?.debug({ key, result }, 'Configuration value existence checked');
            return result;
        }
        catch (error) {
            this.logger?.error({ key, error }, 'Failed to check configuration value existence');
            throw error;
        }
    }
}
exports.ConfigManagerImpl = ConfigManagerImpl;
//# sourceMappingURL=config-manager.js.map