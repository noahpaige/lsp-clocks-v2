import type { Component } from "vue";

/**
 * Action button configuration for ActionsRow
 */
export interface Action {
  /** Unique identifier for this action */
  id: string;

  /** Icon component (from lucide-vue-next) */
  icon?: Component;

  /** Tooltip text shown on hover */
  tooltip?: string;

  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";

  /** Additional CSS classes */
  class?: string;

  /** Whether the action is visible */
  visible?: boolean;

  /** Whether the action is disabled */
  disabled?: boolean;

  /** Custom component to render instead of button */
  component?: Component;

  /** Props to pass to custom component */
  componentProps?: Record<string, any>;
}

/**
 * Table column configuration for ConfigDataTable
 */
export interface TableColumn {
  /** Column key/identifier */
  key: string;

  /** Column header label */
  label: string;

  /** Column width class (e.g., "w-48") */
  width?: string;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Alignment */
  align?: "left" | "center" | "right";

  /** Custom header class */
  headerClass?: string;

  /** Custom cell class */
  cellClass?: string;
}

/**
 * Skeleton configuration for loading states
 */
export interface SkeletonColumn {
  /** Width class (e.g., "w-32") */
  width?: string;

  /** Height class (e.g., "h-5") */
  height?: string;

  /** Additional CSS classes */
  class?: string;

  /** Show a second skeleton line (for subtext) */
  hasSubtext?: boolean;

  /** Subtext skeleton width */
  subtextWidth?: string;
}

/**
 * Configuration for save/restore operations
 */
export interface SaveRestoreConfig {
  /** File pattern for filtering Redis keys (RegExp) */
  filePattern: RegExp;

  /** Function to get keys for save operation */
  getKeysForSave: () => string[];

  /** Function to get keys for restore operation */
  getKeysForRestore: (variant: string) => Promise<string[]>;

  /** Callback after successful restore */
  onRestoreComplete?: () => Promise<void>;
}
