"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const memory_1 = require("./stores/memory");
const file_1 = require("./stores/file");
const redis_1 = require("./stores/redis");
const config_manager_1 = require("./config-manager");
async function fastifyDynamicConfig(fastify, options) {
    const logger = options.logger || fastify.log;
    const storeType = options.store || 'memory';
    logger.info({ store: storeType }, 'Initializing fastify-config plugin');
    let store;
    switch (storeType) {
        case 'memory':
            store = new memory_1.MemoryStore();
            break;
        case 'file':
            store = new file_1.FileStore(options.options);
            break;
        case 'redis':
            store = new redis_1.RedisStore(options.options);
            break;
        default:
            throw new Error(`Unknown store type: ${storeType}`);
    }
    const configManager = new config_manager_1.ConfigManagerImpl(store, logger);
    fastify.decorate('config', configManager);
    fastify.addHook('onClose', async () => {
        if (store.close) {
            await store.close();
        }
    });
    logger.info({ store: storeType }, 'fastify-config plugin initialized');
}
exports.default = (0, fastify_plugin_1.default)(fastifyDynamicConfig, {
    fastify: '>=4.0.0',
    name: 'fastify-config'
});
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map