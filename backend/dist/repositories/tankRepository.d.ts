import { type Tank, type TankContents } from '../domain/models';
import { type TankConfig } from '../domain/config';
export declare const tankRepository: {
    list: () => Tank[];
    getByIx: (ix: number) => Tank | undefined;
    upsertFromConfig: (cuverieId: string, config: TankConfig) => Tank | undefined;
    removeMissing: (cuverieId: string, configs: TankConfig[]) => void;
    updateSetpoint: (ix: number, setpoint: number) => Tank | undefined;
    updateRunning: (ix: number, isRunning: boolean) => Tank | undefined;
    updateContents: (ix: number, contents: TankContents) => Tank | undefined;
    applyTelemetry: (ix: number, payload: Partial<Tank>) => Tank | undefined;
};
//# sourceMappingURL=tankRepository.d.ts.map