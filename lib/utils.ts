import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export const allowedEmailDomains = ["gmail.com", "kluniversity.in"]

export function formatTime(time: string): string {
  if (!time) return "";

  // Check if time is in HH:mm or HH:mm:ss format
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr);
  const minutes = minutesStr;

  if (isNaN(hours)) return time;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return `${hours}:${minutes} ${ampm}`;
}