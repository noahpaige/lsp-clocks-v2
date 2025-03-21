import { DataReceiver } from "./DataReceiver";
import { Readable } from "stream";

export abstract class PipeDR extends DataReceiver {
  protected stream: Readable;

  constructor(stream: Readable) {
    super();
    this.stream = stream;
  }

  openConnection(): void {
    this.stream.on("data", (chunk: Buffer) => {
      try {
        const rawData = JSON.parse(chunk.toString());
        const transformed = this.transform(rawData);
        console.log("Transformed pipe data:", transformed);
      } catch (err) {
        console.error("Failed to parse pipe data:", err);
      }
    });

    console.log("Pipe connection opened.");
  }

  closeConnection(): void {
    this.stream.removeAllListeners("data");
    console.log("Pipe connection closed.");
  }

  // transform will be implemented in final subclass
}
