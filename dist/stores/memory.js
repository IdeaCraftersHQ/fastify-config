"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = void 0;
const types_1 = require("../types");
class MemoryStore {
    store;
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const value = this.store.get(key);
        if (value === undefined) {
            return null;
        }
        try {
            return JSON.parse(value);
        }
        catch (error) {
            throw new types_1.SerializationError(`Failed to deserialize value for key "${key}": ${error}`);
        }
    }
    async set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            this.store.set(key, serialized);
            return true;
        }
        catch (error) {
            throw new types_1.SerializationError(`Failed to serialize value for key "${key}": ${error}`);
        }
    }
    async delete(key) {
        return this.store.delete(key);
    }
    async has(key) {
        return this.store.has(key);
    }
}
exports.MemoryStore = MemoryStore;
//# sourceMappingURL=memory.js.map