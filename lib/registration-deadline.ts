/**
 * Online registrations toggle. Spot registrations: 8:00 AM to 10:00 AM at the venue.
 * Set REGISTRATIONS_CLOSED=false in env to reopen online registrations.
 */

const REGISTRATIONS_CLOSED = process.env.REGISTRATIONS_CLOSED !== "false";

/** Returns true if online registration is closed. Works in browser and Node. */
export function isOnlineRegistrationClosed(): boolean {
  return REGISTRATIONS_CLOSED;
}

/** Alias for consistency (server actions use this) */
export const isOnlineRegistrationClosedServer = isOnlineRegistrationClosed;

export const ONLINE_REG_CLOSED_MESSAGE = `Online Registrations have been closed.

Spot registrations are available every day from 8:00 AM to 10:00 AM at the venue.

Participants can visit the campus on the respective competition day to complete their spot registration within the given time slot.

Please ensure you carry your physical college ID card for verification.`;
