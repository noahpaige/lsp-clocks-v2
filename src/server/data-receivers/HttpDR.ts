import { DataReceiver } from "./DataReceiver";

export abstract class HttpDR extends DataReceiver {
  protected url: string;
  protected interval: NodeJS.Timer | null = null;
  protected pollIntervalMs: number;

  constructor(url: string, pollIntervalMs: number = 5000) {
    super();
    this.url = url;
    this.pollIntervalMs = pollIntervalMs;
  }

  openConnection(): void {
    this.interval = setInterval(async () => {
      try {
        const response = await fetch(this.url);
        const rawData = await response.json();
        const transformed = this.transform(rawData);
        console.log("Transformed HTTP data:", transformed);
      } catch (err) {
        console.error("HTTP fetch error:", err);
      }
    }, this.pollIntervalMs);

    console.log("HTTP polling started.");
  }

  closeConnection(): void {
    if (this.interval) {
      clearInterval(this.interval as unknown as number);
      this.interval = null;
      console.log("HTTP polling stopped.");
    }
  }
}
