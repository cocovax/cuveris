import { EventEmitter } from 'node:events';
import { type Tank } from '../domain/models';
import { type CuverieConfig, type GeneralMode } from '../domain/config';
export type MqttGatewayMode = 'mock' | 'live';
export interface TelemetryEvent {
    tank: Tank;
    source: 'mqtt' | 'mock';
}
export interface ConfigEvent {
    cuveries: Array<CuverieConfig & {
        mode: GeneralMode;
    }>;
}
type TelemetryListener = (event: TelemetryEvent) => void;
type ConfigListener = (event: ConfigEvent) => void;
export declare const mqttGateway: {
    start: () => void;
    stop: () => void;
    switchMode: (nextMode: MqttGatewayMode) => void;
    publishCommand: (tankIx: number, command: Record<string, unknown>) => void;
    publishGeneralMode: (cuverieName: string, modeValue: GeneralMode) => void;
    onTelemetry: (listener: TelemetryListener) => () => EventEmitter<[never]>;
    onConfig: (listener: ConfigListener) => () => EventEmitter<[never]>;
    getMode: () => MqttGatewayMode;
};
export {};
//# sourceMappingURL=mqttGateway.d.ts.map