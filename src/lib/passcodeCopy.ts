export const passcodePlaceholder = "________";

export function passcodeDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}
