import { onMounted, onUnmounted } from "vue";
import { SyncBus } from "@/logic/SyncBus";
import { Events } from "@/types/Events";
import { toast } from "vue-sonner";

const DEFAULT_DURATION = 10000;

export function useToaster() {
  const subscriber = Symbol("useToasterSubscriber"); // ✅ Unique reference for each component

  onMounted(() => {
    SyncBus.on({ subscriber }, "toast", (payload) => {
      const curPath = window.location.pathname;
      const isDisplays = payload.deliverTo === "displays" && curPath.includes("/displays/");
      const isHome = payload.deliverTo === "home" && curPath === "/";
      const isAll = payload.deliverTo === "all";

      if (isDisplays || isHome || isAll) createToast(payload);
    });
  });

  function createToast(payload: Events["toast"]) {
    const options = { duration: DEFAULT_DURATION, ...payload.options };
    if (payload.type === "success") return toast.success(payload.title, options);
    if (payload.type === "info") return toast.info(payload.title, options);
    if (payload.type === "warning") return toast.warning(payload.title, options);
    if (payload.type === "error") return toast.error(payload.title, options);
    return toast(payload.title, options);
  }

  /**
   * Emit a toast event with type safety.
   */
  function emitToast(payload: Events["toast"]) {
    SyncBus.emit("toast", payload);
  }

  /**
   * Cleanup: Automatically remove toast listeners on component unmount.
   */
  onUnmounted(() => {
    SyncBus.off({ subscriber }, "toast");
  });

  return { emitToast };
}
