<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { PanelLeft } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "./utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  }>(),
  {
    size: "sm",
  }
);

const { toggleSidebar } = useSidebar();

const sizeClasses = computed(() => {
  const sizes = {
    xs: { button: "h-6 w-6 [&_svg]:!size-3.5", icon: 14 },
    sm: { button: "h-7 w-7 [&_svg]:!size-4", icon: 16 },
    md: { button: "h-9 w-9 [&_svg]:!size-5", icon: 20 },
    lg: { button: "h-10 w-10 [&_svg]:!size-6", icon: 24 },
    xl: { button: "h-12 w-12 [&_svg]:!size-7", icon: 28 },
    "2xl": { button: "h-14 w-14 [&_svg]:!size-8", icon: 32 },
  };
  return sizes[props.size];
});
</script>

<template>
  <Tooltip :disable-closing-trigger="true" :delay-duration="0">
    <TooltipTrigger as-child>
      <Button
        data-sidebar="trigger"
        variant="ghost"
        size="icon"
        :class="cn(sizeClasses.button, props.class)"
        @click="toggleSidebar"
      >
        <PanelLeft :size="sizeClasses.icon" />
        <span class="sr-only">Toggle Sidebar</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Toggle Sidebar</p>
    </TooltipContent>
  </Tooltip>
</template>
