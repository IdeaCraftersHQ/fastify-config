import { FastifyInstance } from 'fastify';
import { DynamicConfigOptions, ConfigManager } from './types';
declare module 'fastify' {
    interface FastifyInstance {
        config: ConfigManager;
    }
}
declare function fastifyDynamicConfig(fastify: FastifyInstance, options: DynamicConfigOptions): Promise<void>;
declare const _default: typeof fastifyDynamicConfig;
export default _default;
export * from './types';
//# sourceMappingURL=index.d.ts.map