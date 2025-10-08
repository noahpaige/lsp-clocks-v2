import { ClockConfig, parseClockConfig } from "./ClockConfig";

export interface ClockRowConfig {
  clocks: ClockConfig[];
  gap?: number; // Tailwind gap number (4, 8, 12, etc.)
  justify?: string; // Tailwind justify class
  align?: string; // Tailwind align class
  rowClasses?: string; // Override: use this instead of generating from structured properties
}

export function parseRowConfig(raw: any): ClockRowConfig {
  return {
    clocks: raw.clocks?.map((clockRaw: any) => parseClockConfig(clockRaw)) || [],
    gap: raw.gap,
    justify: raw.justify,
    align: raw.align,
    rowClasses: raw.rowClasses,
  };
}

/**
 * Generates Tailwind classes from structured row properties
 */
export function generateRowClasses(row: ClockRowConfig): string {
  if (row.rowClasses) {
    return row.rowClasses;
  }

  const classes: string[] = ["flex", "flex-row"];

  if (row.gap !== undefined) classes.push(`gap-${row.gap}`);
  if (row.justify) classes.push(row.justify);
  if (row.align) classes.push(row.align);

  return classes.join(" ");
}

export const defaultRowConfig: ClockRowConfig = {
  clocks: [],
  gap: 8,
  justify: "center",
  align: "center",
  rowClasses: "",
};
