import { DataReceiver } from "./DataReceiver";

export abstract class WebSocketDR extends DataReceiver {
  protected socket: WebSocket | null = null;
  protected url: string;

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
      try {
        const data = JSON.parse(event.data);
        this.onData(data);
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
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
