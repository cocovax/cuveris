import { EventEmitter } from 'node:events';
import { type EventLogEntry } from '../domain/eventLog';
export declare const eventBus: {
    emit: (event: EventLogEntry) => void;
    subscribe: (listener: (event: EventLogEntry) => void) => () => EventEmitter<[never]>;
};
//# sourceMappingURL=eventBus.d.ts.map