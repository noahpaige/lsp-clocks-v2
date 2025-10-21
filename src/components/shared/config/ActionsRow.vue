<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Action } from "@/types/ConfigComponents";

/**
 * ActionsRow
 *
 * Reusable row of action buttons with support for custom components (like LockWidget).
 *
 * Usage:
 * <ActionsRow
 *   :actions="actions"
 *   :item-id="config.id"
 *   :item-name="config.name"
 *   @action="handleAction"
 * />
 */

interface Props {
  /** Array of actions to display */
  actions: Action[];

  /** ID of the item (for action handlers) */
  itemId?: string;

  /** Name of the item (for action handlers) */
  itemName?: string;

  /** Horizontal alignment */
  justify?: "start" | "end" | "center";

  /** Gap between actions */
  gap?: string;
}

const props = withDefaults(defineProps<Props>(), {
  justify: "end",
  gap: "gap-2",
});

const emit = defineEmits<{
  action: [actionId: string, itemId?: string, itemName?: string];
}>();

const visibleActions = computed(() => props.actions.filter((a) => a.visible !== false));
</script>

<template>
  <div
    class="flex items-center"
    :class="[
      gap,
      {
        'justify-start': justify === 'start',
        'justify-end': justify === 'end',
        'justify-center': justify === 'center',
      },
    ]"
  >
    <template v-for="action in visibleActions" :key="action.id">
      <!-- Custom component (e.g., LockWidget) -->
      <component v-if="action.component" :is="action.component" v-bind="action.componentProps" />

      <!-- Standard button -->
      <Tooltip v-else>
        <TooltipTrigger as-child>
          <Button
            @click="emit('action', action.id, itemId, itemName)"
            :variant="action.variant || 'ghost'"
            :size="action.size || 'icon'"
            :class="action.class"
            :disabled="action.disabled"
            :title="action.tooltip"
          >
            <component v-if="action.icon" :is="action.icon" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent v-if="action.tooltip">
          <p>{{ action.tooltip }}</p>
        </TooltipContent>
      </Tooltip>
    </template>
  </div>
</template>
