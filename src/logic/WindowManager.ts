import { BroadcastChannel } from "broadcast-channel";

interface WindowMessage {
  type: string;
  data?: any;
}

class WindowManager {
  private static instance: WindowManager;
  private windows: Map<string, Window | null> = new Map();
  private isMainWindow: boolean;
  private channel: BroadcastChannel;
  private windowCheckInterval: number | null = null;

  private constructor() {
    this.isMainWindow = window.opener === null;
    this.channel = new BroadcastChannel("window-manager-channel");

    if (this.isMainWindow) {
      this.windows.set(window.location.pathname, window);
      this.channel.onmessage = this.handleMessage.bind(this);
      window.addEventListener("beforeunload", this.closeAllWindows.bind(this));
      this.startWindowCheck();
    }
  }

  static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  private startWindowCheck(): void {
    this.windowCheckInterval = window.setInterval(() => {
      this.windows.forEach((win, url) => {
        if (!win || win.closed) {
          this.windows.delete(url);
          this.channel.postMessage({ type: "close-window", data: { url } });
        }
      });
    }, 1000);
  }

  private stopWindowCheck(): void {
    if (this.windowCheckInterval !== null) {
      clearInterval(this.windowCheckInterval);
      this.windowCheckInterval = null;
    }
  }

  public openWindow(url: string): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "open-window", data: { url } });
      return;
    }

    if (this.windows.has(url) && !this.windows.get(url)?.closed) {
      this.focusWindow(url);
      return;
    }

    const newWindow = window.open(url, "_blank", "width=800,height=600,popup");
    if (newWindow) {
      this.windows.set(url, newWindow);
    }
  }

  closeWindow(url: string): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "close-window", data: { url } });
      return;
    }

    const win = this.windows.get(url);
    if (win && !win.closed) {
      win.close();
      this.windows.delete(url);
    }
  }

  closeAllWindows(): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "close-all-windows", data: {} });
      return;
    }
    this.windows.forEach((win) => win?.close());
    this.windows.clear();
    this.stopWindowCheck();
  }

  focusWindow(url: string): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "focus-window", data: { url } });
      return;
    }
    const win = this.windows.get(url);
    if (win && !win.closed) {
      win.focus();
    }
  }

  private handleMessage(event: WindowMessage): void {
    if (!this.isMainWindow || !event) return;

    const { type, data } = event;
    if (type === "open-window" && data?.url) {
      this.openWindow(data.url);
      return;
    }
    if (type === "close-window" && data?.url) {
      this.closeWindow(data.url);
      return;
    }
    if (type === "focus-window" && data?.url) {
      this.focusWindow(data.url);
      return;
    }
    if (type === "close-all-windows") {
      this.closeAllWindows();
      return;
    }
  }
}

export default WindowManager;
