// DataReceiver.ts

export abstract class DataReceiver {
  /**
   * Opens a connection to the data source.
   * Implementation depends on the subclass (WebSocket, Pipe, etc.).
   */
  abstract openConnection(): void;

  /**
   * Closes the connection to the data source.
   * Implementation depends on the subclass.
   */
  abstract closeConnection(): void;

  /**
   * Handles raw incoming data. Final concrete classes should
   * transform the data and store it in Redis.
   */
  abstract onData(data: Record<string, any>): void;
}
