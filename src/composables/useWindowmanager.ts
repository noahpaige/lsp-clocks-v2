import { onMounted, onUnmounted } from "vue";
import WindowManager from "@/logic/WindowManager"; // Update with the actual path

export function useWindowManager() {
  const windowManager = WindowManager.getInstance();

  onMounted(() => {
    // Any setup logic if needed
  });

  onUnmounted(() => {
    // Cleanup logic if needed
  });

  return {
    openWindow: windowManager.openWindow.bind(windowManager),
    closeWindow: windowManager.closeWindow.bind(windowManager),
    closeAllWindows: windowManager.closeAllWindows.bind(windowManager),
    focusWindow: windowManager.focusWindow.bind(windowManager),
  };
}
