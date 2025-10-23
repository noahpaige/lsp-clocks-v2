<script setup lang="ts">
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConfigEmptyState from "./ConfigEmptyState.vue";
import { useElementHeight } from "@/composables/useElementHeight";
import { computed } from "vue";

/**
 * ConfigDataTable
 *
 * Wrapper component for data tables that handles loading states, empty states,
 * table structure, and consistent Card styling.
 *
 * Usage:
 * <ConfigDataTable
 *   :is-loading="isLoading"
 *   :is-empty="filteredConfigs.length === 0"
 *   :columns="columns"
 *   empty-message="No configurations found."
 *   empty-action-text="Create your first config"
 *   @empty-action="createNew"
 * >
 *   <template #tablebody>
 *     <TableRow v-for="item in data" :key="item.id">
 *       <TableCell>{{ item.name }}</TableCell>
 *       <TableCell>{{ item.description }}</TableCell>
 *       <!-- ... more cells -->
 *     </TableRow>
 *   </template>
 * </ConfigDataTable>
 */

interface Column {
  /** Column key/identifier */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Optional width class */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Whether column is sortable */
  sortable?: boolean;
}

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

  /** Column definitions for table headers */
  columns?: Column[];
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  isEmpty: false,
  emptyMessage: "No items found.",
  showEmptyAction: true,
  skeletonRows: 3,
  cardPadding: "p-0",
  columns: () => [],
});

const emit = defineEmits<{
  "empty-action": [];
}>();

// Track TableHeader element height for reference (optional - can be used by parent components)
const { elementRef: tableHeaderRef, height: tableHeaderHeight } = useElementHeight();
</script>

<template>
  <div class="h-full p-1">
    <Card class="max-h-full flex flex-col">
      <CardContent :class="cardPadding" class="overflow-hidden h-full flex flex-col">
        <!-- Optional header -->
        <slot name="header" />

        <!-- Loading state -->
        <slot v-if="isLoading" name="loading">
          <Table>
            <TableHeader v-if="columns.length > 0">
              <TableRow class="first:rounded-tl-full last:rounded-tr-full table-header-row relative">
                <TableHead
                  v-for="column in columns"
                  :key="column.key"
                  :class="[column.width, `text-${column.align || 'left'}`]"
                >
                  {{ column.label }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="i in skeletonRows" :key="i">
                <TableCell v-for="column in columns" :key="column.key" :class="`text-${column.align || 'left'}`">
                  <Skeleton class="h-5 w-24" />
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
        <div v-else class="relative w-full flex-1 min-h-0 flex flex-col">
          <!-- Sticky header outside of ScrollArea -->
          <div v-if="columns.length > 0" class="border-b flex-shrink-0">
            <Table>
              <TableHeader ref="tableHeaderRef">
                <TableRow class="table-header-row relative">
                  <TableHead
                    v-for="column in columns"
                    :key="column.key"
                    :class="[column.width, `text-${column.align || 'left'}`, 'bg-background']"
                  >
                    {{ column.label }}
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          <!-- Scrollable table body -->
          <ScrollArea as-child type="always" class="flex-1 min-h-0 overflow-hidden">
            <div class="h-full">
              <Table class="w-full">
                <TableBody>
                  <slot name="tablebody" />
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>

        <!-- Optional footer -->
        <slot name="footer" />
      </CardContent>
    </Card>
  </div>
</template>
