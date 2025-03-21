// WebSocketReceiver.ts
import { DataReceiver } from "./DataReceiver";

export abstract class WebSocketDR extends DataReceiver {
  private socket: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    super();
    this.url = url;
  }

  openConnection(): void {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("WebSocket connection opened.");
    };

    this.socket.onmessage = (event) => {
      const rawData = JSON.parse(event.data);
      const transformed = this.transform(rawData);
      console.log("Transformed WebSocket data:", transformed);
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  closeConnection(): void {
    this.socket?.close();
    this.socket = null;
    console.log("WebSocket connection closed.");
  }
}
