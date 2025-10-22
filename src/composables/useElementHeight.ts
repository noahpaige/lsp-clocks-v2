import { ref, onMounted, onUnmounted, type Ref } from "vue";

/**
 * useElementHeight
 *
 * Composable that tracks the height of an HTML element and updates it automatically
 * when the element resizes.
 *
 * @returns Object containing:
 *   - elementRef: Template ref to attach to the element you want to track
 *   - height: Reactive ref containing the current height in pixels
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { elementRef: cardRef, height: cardHeight } = useElementHeight();
 * </script>
 *
 * <template>
 *   <div ref="cardRef">
 *     Height: {{ cardHeight }}px
 *   </div>
 * </template>
 * ```
 */
export function useElementHeight() {
  const elementRef = ref<any>(null);
  const height = ref<number>(0);
  let lastHeight = 0;

  /**
   * Get the actual DOM element from a ref.
   * Handles both native HTML elements and Vue component instances.
   */
  const getDOMElement = (refValue: any): HTMLElement | null => {
    if (!refValue) return null;

    // If it's already a native HTML element
    if (refValue instanceof HTMLElement) {
      return refValue;
    }

    // If it's a Vue component instance, try to get its root element
    if (refValue.$el instanceof HTMLElement) {
      return refValue.$el;
    }

    return null;
  };

  // Calculate element height
  const updateHeight = () => {
    const element = getDOMElement(elementRef.value);
    if (element) {
      const newHeight = element.offsetHeight;
      // Only update if height changed by more than 1px to prevent micro-adjustments
      if (Math.abs(newHeight - lastHeight) > 1) {
        lastHeight = newHeight;
        height.value = newHeight;
      }
    }
  };

  // ResizeObserver for tracking element resize
  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    // Use setTimeout to ensure DOM is fully rendered before initial calculation
    setTimeout(() => {
      updateHeight();

      // Set up ResizeObserver to track element resizing
      const element = getDOMElement(elementRef.value);
      if (element) {
        resizeObserver = new ResizeObserver((entries) => {
          // Use requestAnimationFrame to debounce updates
          requestAnimationFrame(() => {
            updateHeight();
          });
        });
        resizeObserver.observe(element);
      }
    }, 0);
  });

  onUnmounted(() => {
    // Clean up ResizeObserver
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  return {
    elementRef,
    height,
  };
}
