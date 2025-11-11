import { type Tank } from '../domain/models';
type TelemetryEmitter = (payload: Partial<Tank> & {
    ix: number;
    id?: string;
}) => void;
interface MockOptions {
    intervalMs?: number;
    tankIxs?: number[];
}
export declare const startMockTelemetry: (emit: TelemetryEmitter, options?: MockOptions) => void;
export declare const stopMockTelemetry: () => void;
export {};
//# sourceMappingURL=mockTelemetry.d.ts.map