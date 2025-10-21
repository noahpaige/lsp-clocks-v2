<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-vue-next";

/**
 * ConfigDeleteDialog
 *
 * Reusable delete confirmation dialog with customizable content.
 *
 * Usage:
 * <ConfigDeleteDialog
 *   v-model:open="showDeleteDialog"
 *   title="Delete Display Configuration"
 *   :item-name="deleteConfigName"
 *   :item-id="deleteConfigId"
 *   :is-deleting="isDeleting"
 *   @confirm="confirmDelete"
 * />
 */

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  itemName: string;
  itemId?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  isDeleting?: boolean;
  showItemCard?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: "Delete Item",
  description: "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText: "Delete",
  cancelText: "Cancel",
  confirmVariant: "destructive",
  isDeleting: false,
  showItemCard: true,
});

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-1/2 max-w-2xl min-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          <slot name="description">
            {{ description }}
          </slot>
        </DialogDescription>
      </DialogHeader>

      <!-- Custom body slot or default item card -->
      <slot name="body">
        <Card v-if="showItemCard" class="p-0 my-12">
          <CardContent class="py-1 px-4">
            <slot name="item-details">
              <div class="flex items-center justify-between gap-3">
                <div class="flex flex-col items-center gap-2 h-20 mt-3 shrink-0">
                  <span class="font-semibold text-lg">{{ itemName }}</span>
                  <span v-if="itemId" class="text-sm text-muted-foreground">
                    {{ itemId }}
                  </span>
                </div>
              </div>
            </slot>
          </CardContent>
        </Card>
      </slot>

      <!-- Footer -->
      <slot name="footer">
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            @click="
              emit('cancel');
              emit('update:open', false);
            "
            :disabled="isDeleting"
          >
            {{ cancelText }}
          </Button>
          <Button :variant="confirmVariant" @click="emit('confirm')" :disabled="isDeleting">
            <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isDeleting ? "Deleting..." : confirmText }}
          </Button>
        </DialogFooter>
      </slot>
    </DialogContent>
  </Dialog>
</template>
