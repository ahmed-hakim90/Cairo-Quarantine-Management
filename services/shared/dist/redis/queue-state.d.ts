import type { Redis } from "ioredis";
/** Live queue snapshot — not source of truth; rebuild from PostgreSQL on miss. */
export type QueueTicketLiveState = {
    ticketId: string;
    officeId: string;
    queueDate: string;
    queueNumber: number;
    status: "waiting" | "completed";
    aheadCount?: number;
    updatedAt: string;
};
export declare function setQueueTicketLiveState(redis: Redis, state: QueueTicketLiveState): Promise<void>;
export declare function getQueueTicketLiveState(redis: Redis, ticketId: string): Promise<QueueTicketLiveState | null>;
export declare function invalidateQueueTicketLiveState(redis: Redis, ticketId: string): Promise<void>;
/** Fast hint for last issued number; PG transaction remains authoritative. */
export declare function bumpOfficeDayLastQueueNumber(redis: Redis, officeId: string, queueDate: string, queueNumber: number): Promise<void>;
export declare function getOfficeDayLastQueueNumberHint(redis: Redis, officeId: string, queueDate: string): Promise<number | null>;
//# sourceMappingURL=queue-state.d.ts.map