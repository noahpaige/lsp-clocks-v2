import { ClockRowConfig, parseRowConfig } from "./ClockRowConfig";
import type { Versioned } from "./Versioned";
import type { BaseDisplayConfig } from "./BaseDisplayConfig";

/**
 * Base display configuration interface for future extensibility
 */
/**
 * Clock display configuration (backward compatible)
 */
export interface ClockDisplayConfig extends BaseDisplayConfig {
  type?: "clock-layout";
  containerClasses?: string; // Classes for the wrapper around all rows
  rows: ClockRowConfig[];
}

/**
 * Versioned clock display configuration
 */
export type VersionedClockDisplayConfig = Versioned<ClockDisplayConfig>;

/**
 * Union of all display config types (clock-only for now)
 */
export type DisplayConfig = ClockDisplayConfig;

export function parseClockDisplayConfig(raw: any): ClockDisplayConfig {
  return {
    id: raw.id || "",
    name: raw.name || "",
    description: raw.description || "",
    type: raw.type || "clock-layout",
    containerClasses: raw.containerClasses || "",
    rows: raw.rows?.map((rowRaw: any) => parseRowConfig(rowRaw)) || [],
  };
}

export function parseVersionedClockDisplayConfig(raw: any): VersionedClockDisplayConfig {
  const base = parseClockDisplayConfig(raw);
  return {
    ...base,
    version: raw?.version ?? Date.now(),
    lastModifiedBy: raw?.lastModifiedBy,
    lastModifiedAt: raw?.lastModifiedAt,
  } as VersionedClockDisplayConfig;
}
