import { timingSafeEqual } from "node:crypto";

const TIME_ZONE = "Asia/Kolkata";

export function dailyPasscode(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return `${day}${month}${year}`;
}

export function passcodeMatches(entered: string, expected: string): boolean {
  const actual = Buffer.from(entered);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || actual.length === 0) return false;
  return timingSafeEqual(actual, wanted);
}
