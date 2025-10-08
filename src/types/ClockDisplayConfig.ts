import { ClockRowConfig, parseRowConfig } from "./ClockRowConfig";

export interface ClockDisplayConfig {
  id: string;
  name: string;
  description: string;
  containerClasses?: string; // Classes for the wrapper around all rows
  rows: ClockRowConfig[];
}

export function parseClockDisplayConfig(raw: any): ClockDisplayConfig {
  return {
    id: raw.id || "",
    name: raw.name || "",
    description: raw.description || "",
    containerClasses: raw.containerClasses || "",
    rows: raw.rows?.map((rowRaw: any) => parseRowConfig(rowRaw)) || [],
  };
}
