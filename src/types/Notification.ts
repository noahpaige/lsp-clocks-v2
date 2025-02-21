export interface Notification {
  title: string;
  description: string;
  duration?: number;
  severity?: "success" | "info" | "warning" | "error"; // defaults to info
  deliverTo?: "displays" | "home" | "all"; // defaults to home
}
