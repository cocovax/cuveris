import { type Tank, type TankContents } from '../domain/models';
import { type TankConfig } from '../domain/config';
export declare const tankRepository: {
    list: () => Tank[];
    getById: (id: string) => Tank | undefined;
    upsertFromConfig: (cuverieId: string, config: TankConfig) => Tank | undefined;
    removeMissing: (cuverieId: string, configs: TankConfig[]) => void;
    updateSetpoint: (id: string, setpoint: number) => Tank | undefined;
    updateRunning: (id: string, isRunning: boolean) => Tank | undefined;
    updateContents: (id: string, contents: TankContents) => Tank | undefined;
    applyTelemetry: (id: string, payload: Partial<Tank>) => Tank | undefined;
};
//# sourceMappingURL=tankRepository.d.ts.map