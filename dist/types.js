"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializationError = exports.ConnectionError = exports.ConfigStoreError = void 0;
class ConfigStoreError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigStoreError';
    }
}
exports.ConfigStoreError = ConfigStoreError;
class ConnectionError extends ConfigStoreError {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
class SerializationError extends ConfigStoreError {
    constructor(message) {
        super(message);
        this.name = 'SerializationError';
    }
}
exports.SerializationError = SerializationError;
//# sourceMappingURL=types.js.map