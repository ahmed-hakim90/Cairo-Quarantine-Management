function queueLiveKey(ticketId) {
    return `queue:live:${ticketId}`;
}
function queueOfficeDayKey(officeId, queueDate) {
    return `queue:office:${officeId}:${queueDate}:last_number`;
}
const LIVE_TTL_SECONDS = 86_400;
export async function setQueueTicketLiveState(redis, state) {
    await redis.set(queueLiveKey(state.ticketId), JSON.stringify(state), "EX", LIVE_TTL_SECONDS);
}
export async function getQueueTicketLiveState(redis, ticketId) {
    const raw = await redis.get(queueLiveKey(ticketId));
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function invalidateQueueTicketLiveState(redis, ticketId) {
    await redis.del(queueLiveKey(ticketId));
}
/** Fast hint for last issued number; PG transaction remains authoritative. */
export async function bumpOfficeDayLastQueueNumber(redis, officeId, queueDate, queueNumber) {
    const key = queueOfficeDayKey(officeId, queueDate);
    await redis.set(key, String(queueNumber), "EX", LIVE_TTL_SECONDS);
}
export async function getOfficeDayLastQueueNumberHint(redis, officeId, queueDate) {
    const raw = await redis.get(queueOfficeDayKey(officeId, queueDate));
    if (!raw)
        return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
}
