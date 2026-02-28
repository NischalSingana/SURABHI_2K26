/**
 * Online registration closes at 5:00 PM IST each day.
 * After 5 PM, users must use spot registration (campus, before 10:15 AM).
 */

/** Returns true if online registration is closed (past 5 PM IST today). Works in browser and Node. */
export function isOnlineRegistrationClosed(): boolean {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  // IST = UTC + 5:30
  let istHours = utcHours + 5;
  let istMinutes = utcMinutes + 30;
  if (istMinutes >= 60) {
    istMinutes -= 60;
    istHours += 1;
  }
  if (istHours >= 24) istHours -= 24;
  return istHours > 17 || (istHours === 17 && istMinutes >= 0);
}

/** Alias for consistency (server actions use this) */
export const isOnlineRegistrationClosedServer = isOnlineRegistrationClosed;

export const ONLINE_REG_CLOSED_MESSAGE = `Online registrations are closed for today (deadline: 28th February 2026, 5:00 PM).\n\nSpot Registrations: Visit the campus daily up to 10:15 AM with your physical college ID card to complete spot registration. Registrations close strictly at 10:15 AM each day.`;
