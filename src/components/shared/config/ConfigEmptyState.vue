<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { Component } from "vue";

/**
 * ConfigEmptyState
 *
 * Standardized empty state component for when no data is available.
 *
 * Usage:
 * <ConfigEmptyState
 *   message="No display configurations found."
 *   action-text="Create your first display"
 *   @action="createNew"
 * />
 */

interface Props {
  /** Main message to display */
  message: string;

  /** Call-to-action button text */
  actionText?: string;

  /** Whether to show the action button */
  showAction?: boolean;

  /** Icon to display above message */
  icon?: Component;

  /** Classes for icon (e.g., size, color) */
  iconClass?: string;
}

withDefaults(defineProps<Props>(), {
  showAction: true,
  iconClass: "",
});

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="text-center py-12 px-4">
    <slot>
      <!-- Icon -->
      <slot name="icon">
        <component v-if="icon" :is="icon" :class="['mx-auto mb-4', iconClass]" />
      </slot>

      <!-- Message -->
      <slot name="message">
        <p class="text-muted-foreground">{{ message }}</p>
      </slot>

      <!-- Action -->
      <slot name="action">
        <Button v-if="showAction && actionText" @click="emit('action')" variant="link" class="mt-2">
          {{ actionText }}
        </Button>
      </slot>
    </slot>
  </div>
</template>
