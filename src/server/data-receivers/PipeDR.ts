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
        const data = JSON.parse(chunk.toString());
        this.onData(data);
      } catch (err) {
        console.error("Pipe data parse error:", err);
      }
    });

    console.log("Pipe connection opened.");
  }

  closeConnection(): void {
    this.stream.removeAllListeners("data");
    console.log("Pipe connection closed.");
  }
}
