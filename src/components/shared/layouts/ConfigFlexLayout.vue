<script setup lang="ts">
/**
 * ConfigFlexLayout
 *
 * A flexbox-based layout where the header has a natural height and the body
 * fills the remaining vertical space. This prevents the page from scrolling -
 * the body must handle its own scrolling if needed.
 *
 * Usage:
 * <ConfigFlexLayout>
 *   <template #header>
 *     <ConfigHeaderBar ... />
 *   </template>
 *   <template #body>
 *     <div class="overflow-y-auto h-full">
 *       <!-- Scrollable content -->
 *     </div>
 *   </template>
 * </ConfigFlexLayout>
 */
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header: Natural height, no scrolling -->
    <div class="flex-none">
      <slot name="header" />
    </div>

    <!-- Body: Fills remaining space, handles own scrolling -->
    <div class="flex-1 overflow-hidden">
      <slot name="body" />
    </div>
  </div>
</template>
