/**
 * Version metadata fields for concurrent editing support
 */
export interface VersionMetadata {
  version: number; // Timestamp of last save (for conflict detection)
  lastModifiedBy?: string; // Session ID or user ID who made the change
  lastModifiedAt?: number; // Human-readable timestamp (same as version)
}

/**
 * Generic wrapper type that adds version metadata to any data type
 */
export type Versioned<T> = T & VersionMetadata;

/**
 * Add version metadata to data (for new records)
 */
export function withVersion<T>(data: T, sessionId: string): Versioned<T> {
  const timestamp = Date.now();
  return {
    ...data,
    version: timestamp,
    lastModifiedBy: sessionId,
    lastModifiedAt: timestamp,
  } as Versioned<T>;
}

/**
 * Update version metadata on existing data (for updates)
 */
export function updateVersion<T>(data: T, sessionId: string): Versioned<T> {
  const timestamp = Date.now();
  return {
    ...data,
    version: timestamp,
    lastModifiedBy: sessionId,
    lastModifiedAt: timestamp,
  } as Versioned<T>;
}

/**
 * Strip version metadata from data (if needed)
 */
export function withoutVersion<T>(versionedData: Versioned<T>): T {
  const { version, lastModifiedBy, lastModifiedAt, ...rest } = versionedData as any;
  return rest as T;
}

/**
 * Parse versioned data from raw object
 */
export function parseVersioned<T>(raw: any, parser: (raw: any) => T): Versioned<T> {
  const base = parser(raw);
  return {
    ...base,
    version: raw?.version ?? Date.now(),
    lastModifiedBy: raw?.lastModifiedBy,
    lastModifiedAt: raw?.lastModifiedAt,
  } as Versioned<T>;
}
