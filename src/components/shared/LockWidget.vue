<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Lock, LockOpen, Handshake, Axe } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEditLock } from "@/composables/useEditLock";
import { useSessionId } from "@/composables/useSessionId";
import { useToaster } from "@/composables/useToaster";
import type { EditLock } from "@/types/EditLock";

interface Props {
  configId: string;
  configName?: string;
}

const props = defineProps<Props>();

const { checkLock, acquireLock, releaseLock, observeLock } = useEditLock();
const { sessionId, userName } = useSessionId();
const { emitToast } = useToaster();

// State
const lockStatus = ref<EditLock | null>(null);
const isOwnLock = ref(false);
const isLoading = ref(false);
const isDropdownOpen = ref(false);

// Computed
const lockIconColorClass = computed(() => {
  if (!lockStatus.value) return "text-muted-foreground"; // Default/white - no lock
  if (isOwnLock.value) return "text-green-500"; // Green - you own it
  return "text-red-500"; // Red - someone else owns it
});

const ownerText = computed(() => {
  if (!lockStatus.value) return "None";
  if (isOwnLock.value) return `You (${userName.value})`;
  return `${lockStatus.value.userName}`;
});

function onRequestLock() {
  const configName = props.configName || props.configId;

  if (lockStatus.value) {
    emitToast({
      title: `Lock Request. ${userName.value} is requesting the lock for "${configName}" from ${lockStatus.value.userName}`,
      type: "info",
      deliverTo: "all",
    });
  } else {
    emitToast({
      title: `No Lock to Request: "${configName}" is not currently locked.`,
      type: "info",
      deliverTo: "all",
    });
  }
}

async function onForceLock() {
  const configName = props.configName || props.configId;
  const fullKey = `clock-display-config:${props.configId}`;

  try {
    await acquireLock(fullKey);

    emitToast({
      title: `Lock Acquired. You now have the lock for "${configName}"`,
      type: "success",
      deliverTo: "all",
    });
  } catch (error) {
    console.error("[LockWidget] Error forcing lock:", error);
    emitToast({
      title: "Error: Failed to acquire lock",
      type: "error",
      deliverTo: "all",
    });
  }
}

async function onReleaseLock() {
  const configName = props.configName || props.configId;
  const fullKey = `clock-display-config:${props.configId}`;

  try {
    await releaseLock(fullKey);

    emitToast({
      title: `Lock Released. You released the lock for "${configName}"`,
      type: "success",
      deliverTo: "all",
    });
  } catch (error) {
    console.error("[LockWidget] Error releasing lock:", error);
    emitToast({
      title: "Error. Failed to release lock",
      type: "error",
      deliverTo: "all",
    });
  }
}

// Lifecycle
onMounted(async () => {
  // Set up real-time observer for lock changes
  const fullKey = `clock-display-config:${props.configId}`;
  observeLock(fullKey, (lock) => {
    // the key doesn't exist. This means nobody owns the lock.
    if (!lock) {
      lockStatus.value = null;
      isOwnLock.value = false;
      return;
    }

    console.log(`[LockWidget] Real-time update for ${props.configId}:`, lock);
    lockStatus.value = lock;
    isOwnLock.value = lock?.sessionId === sessionId.value;
  });
});
</script>

<template>
  <DropdownMenu v-model:open="isDropdownOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="[lockIconColorClass, { 'bg-accent': isDropdownOpen }]"
        title="Lock Status"
        :disabled="isLoading"
      >
        <Lock v-if="lockStatus" class="h-4 w-4" />
        <LockOpen v-else class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      <!-- Owner info -->
      <DropdownMenuLabel v-if="lockStatus"> Owner: {{ ownerText }} </DropdownMenuLabel>
      <DropdownMenuSeparator v-if="lockStatus" />

      <!-- Actions -->
      <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" @click="onRequestLock">
        <Handshake class="h-4 w-4" /> Request Lock
      </DropdownMenuItem>

      <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" @click="onForceLock">
        <Axe class="h-4 w-4" /> Force Lock
      </DropdownMenuItem>

      <DropdownMenuItem
        v-if="isOwnLock"
        @click="onReleaseLock"
        class="flex items-center gap-2 cursor-pointer text-destructive"
      >
        <LockOpen class="h-4 w-4" />
        Release Lock
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
