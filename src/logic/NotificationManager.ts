import { Notification } from "../types/Notification";
import NotificationBus from "@/utils/NotificationBus";
import { toast } from "vue-sonner";

export default class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {
    NotificationBus.on("notify", this.handleNotification.bind(this));
    NotificationBus.on("clear", this.handleClear);
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /** Call this in the onUnmounted hook to clean up event listeners. */
  public onUnmounted() {
    NotificationBus.off("notify", this.handleNotification.bind(this));
    NotificationBus.off("clear", this.handleClear.bind(this));
  }

  private handleNotification(notification: Notification) {
    const curLocation = this.getDeliveryLocation();

    if (!notification.deliverTo || curLocation === "all" || curLocation === notification.deliverTo)
      this.createToast(notification);
  }

  private handleClear() {
    toast.dismiss(); // dismisses all if no id is given
  }

  private createToast(notification: Notification) {
    const options = {
      description: notification.description,
      duration: notification.duration || 10000,
    };
    if (notification.severity === "success") return toast.success(notification.title, options);
    if (notification.severity === "info") return toast.info(notification.title, options);
    if (notification.severity === "warning") return toast.warning(notification.title, options);
    if (notification.severity === "error") return toast.error(notification.title, options);
    return toast(notification.title, options);
  }

  private getDeliveryLocation(): string {
    const url = window.location.href;
    if (url.includes("/clocks/")) return "displays";
    return "home";
  }
}
