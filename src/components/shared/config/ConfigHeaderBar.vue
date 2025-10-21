<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Save, Upload, Loader2 } from "lucide-vue-next";
import type { Component } from "vue";

/**
 * ConfigHeaderBar
 *
 * Standardized header bar for configuration pages with search, create button,
 * and optional save/restore functionality.
 *
 * Usage:
 * <ConfigHeaderBar
 *   v-model:search-query="searchQuery"
 *   search-placeholder="Search displays..."
 *   create-button-text="Create Display"
 *   :show-save-restore="true"
 *   @create="createNew"
 *   @save="openSaveDialog"
 *   @restore="openRestoreDialog"
 * />
 */

interface Props {
  // Search functionality
  searchQuery?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  searchMaxWidth?: string;

  // Create button
  createButtonText?: string;
  createButtonIcon?: Component;
  showCreateButton?: boolean;
  createButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  // Save/Restore buttons
  showSaveRestore?: boolean;
  isSaving?: boolean;
  isRestoring?: boolean;
  saveButtonText?: string;
  restoreButtonText?: string;
  saveTooltip?: string;
  restoreTooltip?: string;
  saveIcon?: Component;
  restoreIcon?: Component;
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: "Search...",
  showSearch: true,
  searchMaxWidth: "max-w-60",
  createButtonText: "Create",
  createButtonIcon: () => Plus,
  showCreateButton: true,
  createButtonVariant: "default",
  showSaveRestore: false,
  isSaving: false,
  isRestoring: false,
  saveButtonText: "Save",
  restoreButtonText: "Restore",
  saveTooltip: "Save to file",
  restoreTooltip: "Restore from file",
  saveIcon: () => Save,
  restoreIcon: () => Upload,
});

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  create: [];
  save: [];
  restore: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-2 py-4">
    <!-- Left side: Search -->
    <slot name="left">
      <div v-if="showSearch" class="relative" :class="searchMaxWidth">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          @update:model-value="emit('update:searchQuery', $event)"
          :placeholder="searchPlaceholder"
          class="pl-10"
        />
      </div>
    </slot>

    <!-- Right side: Actions -->
    <slot name="right">
      <div class="flex gap-4">
        <slot name="actions-start" />

        <!-- Create button -->
        <Button v-if="showCreateButton" @click="emit('create')" :variant="createButtonVariant">
          <component :is="createButtonIcon" class="mr-2 h-4 w-4" />
          {{ createButtonText }}
        </Button>

        <!-- Save/Restore group -->
        <ButtonGroup v-if="showSaveRestore">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="emit('save')" variant="outline" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                <component v-else :is="saveIcon" class="mr-2 h-4 w-4" />
                {{ isSaving ? "Saving..." : saveButtonText }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ saveTooltip }}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="emit('restore')" variant="outline" :disabled="isRestoring">
                <Loader2 v-if="isRestoring" class="mr-2 h-4 w-4 animate-spin" />
                <component v-else :is="restoreIcon" class="mr-2 h-4 w-4" />
                {{ isRestoring ? "Restoring..." : restoreButtonText }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ restoreTooltip }}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <slot name="actions-end" />
      </div>
    </slot>
  </div>
</template>
