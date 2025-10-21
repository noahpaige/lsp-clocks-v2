<script setup lang="ts">
/**
 * ConfigScrollLayout
 *
 * A standard scrollable layout with a sticky header. The entire page scrolls
 * naturally, but the header remains at the top of the viewport.
 *
 * Usage:
 * <ConfigScrollLayout header-class="border-b shadow-sm">
 *   <template #header>
 *     <ConfigHeaderBar ... />
 *   </template>
 *   <template #body>
 *     <div class="space-y-6 p-6">
 *       <!-- Content naturally scrolls -->
 *     </div>
 *   </template>
 * </ConfigScrollLayout>
 */

interface Props {
  /** Additional classes for header wrapper */
  headerClass?: string;

  /** Additional classes for body wrapper */
  bodyClass?: string;

  /** z-index for sticky header */
  headerZIndex?: number;
}

withDefaults(defineProps<Props>(), {
  headerClass: "",
  bodyClass: "",
  headerZIndex: 10,
});
</script>

<template>
  <div class="relative">
    <!-- Sticky header -->
    <div :class="['sticky top-0 bg-background', headerClass]" :style="{ zIndex: headerZIndex }">
      <slot name="header" />
    </div>

    <!-- Scrollable body -->
    <div :class="bodyClass">
      <slot name="body" />
    </div>
  </div>
</template>
