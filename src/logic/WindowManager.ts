import { BroadcastChannel } from "broadcast-channel";

interface WindowMessage {
  type: string;
  data?: any;
}

class WindowManager {
  private static instance: WindowManager;
  private windows: Map<string, { win: Window | null; callback?: () => void }> = new Map();
  private isMainWindow: boolean;
  private channel: BroadcastChannel;
  private windowCheckInterval: number | null = null;

  private constructor() {
    this.isMainWindow = window.opener === null;
    this.channel = new BroadcastChannel("window-manager-channel");

    if (this.isMainWindow) {
      this.windows.set(window.location.pathname, { win: window });
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
      this.windows.forEach((entry, url) => {
        if (!entry.win || entry.win.closed) {
          this.windows.delete(url);
          if (entry.callback) entry.callback();
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

  public openWindow(url: string, onClose?: () => void): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "open-window", data: { url } });
      return;
    }

    if (this.windows.has(url) && !this.windows.get(url)?.win?.closed) {
      this.focusWindow(url);
      return;
    }

    const newWindow = window.open(url, "_blank", "width=800,height=600,popup");
    if (newWindow) {
      this.windows.set(url, { win: newWindow, callback: onClose });
    }
  }

  public isWindowOpen(url: string): boolean {
    const entry = this.windows.get(url);
    return entry !== undefined && entry.win !== null && !entry.win.closed;
  }

  public closeWindow(url: string): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "close-window", data: { url } });
      return;
    }

    const entry = this.windows.get(url);
    if (entry?.win && !entry.win.closed) {
      entry.win.close();
      this.windows.delete(url);
      if (entry.callback) entry.callback();
      this.channel.postMessage({ type: "window-closed", data: { url } });
    }
  }

  public closeAllWindows(): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "close-all-windows", data: {} });
      return;
    }
    this.windows.forEach((entry, url) => {
      if (entry.win && !entry.win.closed) {
        entry.win.close();
        if (entry.callback) entry.callback();
        this.channel.postMessage({ type: "window-closed", data: { url } });
      }
    });
    this.windows.clear();
    this.stopWindowCheck();
  }

  public focusWindow(url: string): void {
    if (!this.isMainWindow) {
      this.channel.postMessage({ type: "focus-window", data: { url } });
      return;
    }
    const entry = this.windows.get(url);
    if (entry?.win && !entry.win.closed) {
      entry.win.focus();
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
