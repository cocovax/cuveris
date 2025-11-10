export interface TankConfig {
    id: string;
    ix: number;
    displayName: string;
    order: number;
}
export interface CuverieConfig {
    id: string;
    name: string;
    tanks: TankConfig[];
}
export type GeneralMode = 'CHAUD' | 'FROID' | 'ARRET';
//# sourceMappingURL=config.d.ts.map