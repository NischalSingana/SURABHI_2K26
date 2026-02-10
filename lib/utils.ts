import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export const allowedEmailDomains = ["gmail.com", "kluniversity.in"]

export function formatTime(time: string): string {
  if (!time) return "";

  // Already has AM/PM - return as-is to avoid double suffix (e.g. "10:00 AM AM")
  if (/AM|PM/i.test(time.trim())) return time.trim();

  // Parse HH:mm or HH:mm:ss format
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr);
  const minutes = (minutesStr || "00").replace(/\D.*$/, "") || "00"; // strip seconds/AM/PM if any

  if (isNaN(hours)) return time;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes} ${ampm}`;
}