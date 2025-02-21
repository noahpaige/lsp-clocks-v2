import mitt from "mitt";
import { Notification } from "../types/Notification";

type NotificationEvents = {
  notify: Notification;
  clear: void;
};

const NotificationBus = mitt<NotificationEvents>();

export default NotificationBus;
