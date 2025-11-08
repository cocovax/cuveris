import { EventEmitter } from 'node:events';
import { type Tank } from '../domain/models';
export type MqttGatewayMode = 'mock' | 'live';
export interface TelemetryEvent {
    tank: Tank;
    source: 'mqtt' | 'mock';
}
type TelemetryListener = (event: TelemetryEvent) => void;
export declare const mqttGateway: {
    start: () => void;
    stop: () => void;
    switchMode: (nextMode: MqttGatewayMode) => void;
    publishCommand: (tankId: string, command: Record<string, unknown>) => void;
    onTelemetry: (listener: TelemetryListener) => () => EventEmitter<[never]>;
    getMode: () => MqttGatewayMode;
};
export {};
//# sourceMappingURL=mqttGateway.d.ts.map