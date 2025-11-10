import { type CuverieConfig } from '../domain/config';
export declare const configRepository: {
    list: () => CuverieConfig[];
    upsert: (cuverie: CuverieConfig) => void;
    deleteById: (id: string) => void;
};
//# sourceMappingURL=configRepository.d.ts.map