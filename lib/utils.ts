import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeDatacenter(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (trimmed.endsWith(".qualtrics.com")) {
    return trimmed.replace(".qualtrics.com", "");
  }
  return trimmed;
}
