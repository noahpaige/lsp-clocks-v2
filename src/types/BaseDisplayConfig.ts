/**
 * Base display configuration interface for all display types.
 * Kept minimal and reusable across different display variants.
 */
export interface BaseDisplayConfig {
  id: string;
  name: string;
  description: string;
  /**
   * Optional discriminator to support gradual adoption without breaking existing code.
   * Example values: "clock-layout", "map", "chart".
   */
  type?: string;
}
