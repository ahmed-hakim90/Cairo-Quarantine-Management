export type ServiceConfig = {
    nodeEnv: string;
    databaseUrl: string;
    redisUrl: string;
    apiPort: number;
    apiHost: string;
    adminApiSecret: string;
    corsOrigins: string[];
};
export declare function loadServiceConfig(): ServiceConfig;
//# sourceMappingURL=config.d.ts.map