<template>
  <!-- This component does not render anything, it only listens for notifications -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { toast } from "vue-sonner";
import NotificationBus from "@/utils/NotificationBus";
import { Notification } from "@/types/Notification";

const createToast = (notification: Notification) => {
  const options = {
    description: notification.description,
    duration: notification.duration || 10000,
  };
  if (notification.type === "success") return toast.success(notification.title, options);
  if (notification.type === "info") return toast.info(notification.title, options);
  if (notification.type === "warning") return toast.warning(notification.title, options);
  if (notification.type === "error") return toast.error(notification.title, options);
  return toast(notification.title, options);
};

const getDeliveryLocation = (): string => {
  const url = window.location.href;
  if (url.includes("/clocks/")) return "displays";
  return "home";
};

const handleNotification = (notification: Notification) => {
  const curLocation = getDeliveryLocation();

  if (curLocation === "all" || curLocation === notification.location) createToast(notification);
};

const handleClear = () => {
  toast.dismiss(); // dismisses all if no id is given
};

onMounted(() => {
  NotificationBus.on("notify", handleNotification);
  NotificationBus.on("clear", handleClear);
});

onUnmounted(() => {
  NotificationBus.off("notify", handleNotification);
});
</script>

<style scoped>
/* No styles needed as this component does not render anything */
</style>
