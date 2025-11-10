import { type EventLogEntry } from '../domain/eventLog';
export declare const eventRepository: {
    list: (limit?: number) => EventLogEntry[];
    append: (event: EventLogEntry) => void;
};
//# sourceMappingURL=eventRepository.d.ts.map