// DataReceiver.ts

export abstract class DataReceiver {
  /**
   * Opens a connection to the data source.
   * Implementation depends on the subclass (WebSocket, SSE, etc.).
   */
  abstract openConnection(): void;

  /**
   * Closes the connection to the data source.
   * Implementation depends on the subclass.
   */
  abstract closeConnection(): void;

  /**
   * Transforms the incoming raw data into a desired format.
   * Each subclass defines its own transformation logic.
   *
   * @param data - The raw data object received from the source
   * @returns The transformed data object
   */
  abstract transform(data: Record<string, any>): Record<string, any>;
}
