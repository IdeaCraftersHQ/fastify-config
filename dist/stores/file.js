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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStore = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const types_1 = require("../types");
class FileStore {
    filePath;
    pretty;
    data;
    writeQueue = Promise.resolve();
    initialized = false;
    initPromise = null;
    constructor(options = {}) {
        this.filePath = options.path || './config/dynamic.json';
        this.pretty = options.pretty ?? true;
        this.data = new Map();
    }
    async initialize() {
        if (this.initialized)
            return;
        if (this.initPromise) {
            await this.initPromise;
            return;
        }
        this.initPromise = this.performInitialization();
        await this.initPromise;
    }
    async performInitialization() {
        try {
            await this.ensureFile();
            await this.loadFromFile();
            this.initialized = true;
        }
        finally {
            this.initPromise = null;
        }
    }
    async ensureFile() {
        try {
            await fs_1.promises.access(this.filePath);
        }
        catch {
            const dir = path.dirname(this.filePath);
            await fs_1.promises.mkdir(dir, { recursive: true });
            await this.saveToFile();
        }
    }
    async loadFromFile() {
        try {
            const content = await fs_1.promises.readFile(this.filePath, 'utf-8');
            const parsed = JSON.parse(content || '{}');
            this.data = new Map(Object.entries(parsed));
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new types_1.ConfigStoreError(`Failed to load config file: ${error}`);
            }
            this.data = new Map();
        }
    }
    async saveToFile() {
        const obj = Object.fromEntries(this.data);
        const content = this.pretty
            ? JSON.stringify(obj, null, 2)
            : JSON.stringify(obj);
        const tempFile = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(7)}`;
        await fs_1.promises.writeFile(tempFile, content, 'utf-8');
        await fs_1.promises.rename(tempFile, this.filePath);
    }
    queueWrite() {
        this.writeQueue = this.writeQueue.then(() => this.saveToFile()).catch(error => {
            console.error(`Failed to write to file: ${error}`);
        });
        return this.writeQueue;
    }
    async get(key) {
        await this.initialize();
        const value = this.data.get(key);
        return value !== undefined ? value : null;
    }
    async set(key, value) {
        await this.initialize();
        try {
            JSON.stringify(value);
        }
        catch (error) {
            throw new types_1.SerializationError(`Failed to serialize value for key "${key}": ${error}`);
        }
        this.data.set(key, value);
        await this.queueWrite();
        return true;
    }
    async delete(key) {
        await this.initialize();
        const result = this.data.delete(key);
        if (result) {
            await this.queueWrite();
        }
        return result;
    }
    async has(key) {
        await this.initialize();
        return this.data.has(key);
    }
}
exports.FileStore = FileStore;
//# sourceMappingURL=file.js.map