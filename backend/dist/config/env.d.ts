export declare const env: {
    nodeEnv: "development" | "production" | "test";
    port: number;
    mqtt: {
        url: string | undefined;
        username: string | undefined;
        password: string | undefined;
        topics: {
            telemetry: string;
            commands: string;
            alarms: string;
        };
        reconnectPeriod: number;
        enableMock: boolean;
    };
    auth: {
        secret: string;
        demoUser: {
            email: string;
            password: string;
        };
    };
    data: {
        provider: "memory" | "postgres";
        databaseUrl: string | undefined;
        timeseriesUrl: string | undefined;
    };
};
export type AppEnv = typeof env;
//# sourceMappingURL=env.d.ts.map