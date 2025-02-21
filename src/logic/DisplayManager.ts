import { Router } from "vue-router";

/**
 * Singleton class to manage and track multiple display windows.
 */
class DisplayManager {
  private static instance: DisplayManager;

  /** Map storing display names and their corresponding window references. */
  private displays: Map<string, Window | null>;

  /** Interval (in milliseconds) at which window status is checked. */
  private checkInterval: number;

  /** Interval ID for the monitoring function. */
  private monitorInterval: number | undefined;

  /** Vue Router instance for resolving routes. */
  private router: Router;

  /**
   * Private constructor to prevent direct instantiation.
   * @param router - The Vue Router instance.
   */
  private constructor(router: Router) {
    this.displays = new Map();
    this.checkInterval = 1000; // Check interval in milliseconds
    this.router = router;
    this.startMonitoring();
  }

  /**
   * Retrieves the singleton instance of DisplayManager.
   * @param router - The Vue Router instance.
   * @returns The singleton instance of DisplayManager.
   */
  public static getInstance(router: Router): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager(router);
    }
    return DisplayManager.instance;
  }

  /**
   * Opens a new display window.
   * @param displayName - The name of the display.
   * @param route - The route to be opened in the new window.
   */
  openDisplay(displayName: string, route: string): void {
    if (this.displays.has(displayName)) {
      console.log(`Display "${displayName}" is already open.`);
      return;
    }

    const url = this.router.resolve(route).href;
    const fullUrl = `${window.location.origin}${url}`;
    const newWindow: Window | null = window.open(fullUrl, displayName);

    if (newWindow) {
      this.displays.set(displayName, newWindow);
      console.log(`Display "${displayName}" opened.`);
    } else {
      console.log(`Failed to open display "${displayName}".`);
    }
  }

  /**
   * Starts monitoring the status of opened windows and removes closed ones.
   */
  private startMonitoring(): void {
    this.monitorInterval = window.setInterval(() => {
      this.displays.forEach((win, displayName) => {
        if (!win || win.closed) {
          this.displays.delete(displayName);
          console.log(`Display "${displayName}" has been closed.`);
        }
      });
    }, this.checkInterval);
  }

  /**
   * Stops monitoring the status of opened windows.
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }

  /**
   * Closes a specific display window.
   * @param displayName - The name of the display to close.
   */
  closeDisplay(displayName: string): void {
    const win = this.displays.get(displayName);
    if (win && !win.closed) {
      win.close();
      this.displays.delete(displayName);
      console.log(`Display "${displayName}" closed.`);
    } else {
      console.log(`Display "${displayName}" is not open.`);
    }
  }

  /**
   * Closes all currently open display windows.
   */
  closeAllDisplays(): void {
    this.displays.forEach((win, displayName) => {
      if (win && !win.closed) {
        win.close();
        console.log(`Display "${displayName}" closed.`);
      }
    });
    this.displays.clear();
  }
}

export default DisplayManager;

// Usage example (must be called inside a Vue setup with router instance)
// import { useRouter } from "vue-router";
// const router = useRouter();
// const manager = DisplayManager.getInstance(router);
// manager.openDisplay('Display1', '/route1');
// manager.openDisplay('Display2', '/route2');

// To close a display
// manager.closeDisplay('Display1');

// To close all displays
// manager.closeAllDisplays();
