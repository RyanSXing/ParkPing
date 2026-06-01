import { z } from "zod";

export function normalizePlate(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export const plateSchema = z
  .string()
  .transform(normalizePlate)
  .pipe(z.string().min(1).max(16));
