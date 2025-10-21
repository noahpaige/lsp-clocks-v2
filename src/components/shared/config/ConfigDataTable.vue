<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ConfigEmptyState from "./ConfigEmptyState.vue";

/**
 * ConfigDataTable
 *
 * Wrapper component for data tables that handles loading states, empty states,
 * and consistent Card styling.
 *
 * Usage:
 * <ConfigDataTable
 *   :is-loading="isLoading"
 *   :is-empty="filteredConfigs.length === 0"
 *   empty-message="No configurations found."
 *   empty-action-text="Create your first config"
 *   @empty-action="createNew"
 * >
 *   <Table>
 *     <!-- Table content -->
 *   </Table>
 * </ConfigDataTable>
 */

interface Props {
  /** Whether data is loading */
  isLoading?: boolean;

  /** Whether data is empty */
  isEmpty?: boolean;

  /** Message to show when empty */
  emptyMessage?: string;

  /** Action button text for empty state */
  emptyActionText?: string;

  /** Whether to show empty state action button */
  showEmptyAction?: boolean;

  /** Number of skeleton rows to show */
  skeletonRows?: number;

  /** Padding class for card content */
  cardPadding?: string;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  isEmpty: false,
  emptyMessage: "No items found.",
  showEmptyAction: true,
  skeletonRows: 3,
  cardPadding: "p-0",
});

const emit = defineEmits<{
  "empty-action": [];
}>();
</script>

<template>
  <Card>
    <CardContent :class="cardPadding">
      <!-- Optional header -->
      <slot name="header" />

      <!-- Loading state -->
      <slot v-if="isLoading" name="loading">
        <Table>
          <TableBody>
            <TableRow v-for="i in skeletonRows" :key="i">
              <TableCell colspan="100%">
                <div class="flex gap-4">
                  <Skeleton class="h-5 w-32" />
                  <Skeleton class="h-5 w-48" />
                  <Skeleton class="h-5 w-20" />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </slot>

      <!-- Empty state -->
      <slot v-else-if="isEmpty" name="empty">
        <ConfigEmptyState
          :message="emptyMessage"
          :action-text="emptyActionText"
          :show-action="showEmptyAction"
          @action="emit('empty-action')"
        />
      </slot>

      <!-- Table content -->
      <slot v-else />

      <!-- Optional footer -->
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
