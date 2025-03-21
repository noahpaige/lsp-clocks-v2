import { DataReceiver } from "@/server/data-receivers/DataReceiver";
import { ClockDataType } from "@/types/ClockData";
import RedisAPI from "@/server/RedisAPI";

export class ClockSpooferDR extends DataReceiver {
  static updateInterval = 1000;
  private intervalRef: NodeJS.Timeout | undefined = undefined;
  private clockData: ClockDataType;
  private readonly REDISKEY = "clockdata";

  constructor() {
    super();

    const date = new Date();
    const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    const tZero = date.getTime() + date.getTimezoneOffset() * 60 * 1000 - 1000 * 60 * 60 * 14;

    this.clockData = {
      utc: utc,
      local: Date.now(),
      timezoneStr: new Date().toLocaleString("en-US", { timeZoneName: "short" }).split(" ")[3],
      t: -1000 * 60 * 60 * 13,
      l: -1000 * 60 * 60 * 14,
      holdRemaining: 1000 * 60 * 60 * 1,
      untilRestart: 1000 * 60 * 60 * 2,
      windowUsed: 0,
      windowRemaining: 1000 * 60 * 60 * 4,
      tZero: tZero,
      met: utc - tZero,
    };
  }
  /**
   * Opens a connection to the data source.
   * Implementation depends on the subclass (WebSocket, Pipe, etc.).
   */
  openConnection(): void {
    this.intervalRef = setInterval(() => {
      const date = new Date();

      this.clockData = {
        utc: date.getTime() + date.getTimezoneOffset() * 60 * 1000,
        local: Date.now(),
        timezoneStr: new Date().toLocaleString("en-US", { timeZoneName: "short" }).split(" ")[3],
        t: this.clockData.t++,
        l: this.clockData.l++,
        holdRemaining: this.clockData.holdRemaining,
        untilRestart: this.clockData.untilRestart,
        windowUsed: 0,
        windowRemaining: 1000 * 60 * 60 * 4,
        tZero: date.getTime() + date.getTimezoneOffset() * 60 * 1000 - 1000 * 60 * 60 * 14,
        met: this.clockData.met++,
      };

      this.onData(this.clockData);
    }, ClockSpooferDR.updateInterval);
  }

  /**
   * Closes the connection to the data source.
   * Implementation depends on the subclass.
   */
  closeConnection(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = undefined;
    }
  }

  /**
   * Handles raw incoming data. Final concrete classes should
   * transform the data and store it in Redis.
   */
  onData(data: Record<string, any>): void {
    const args = ["HSET", this.REDISKEY, ...Object.entries(data).flatMap(([field, value]) => [field, String(value)])];
    RedisAPI.sendCommand(args);
  }
}
