import { type Alarm } from '../domain/models';
export declare const alarmRepository: {
    list: () => Alarm[];
    add: (alarm: Alarm) => Alarm;
    acknowledge: (id: string) => Alarm | undefined;
};
//# sourceMappingURL=alarmRepository.d.ts.map