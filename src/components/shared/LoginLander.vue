<script setup lang="ts">
import { Rocket } from "lucide-vue-next";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
    <AnimatedBackground4 />
    <div class="flex w-full max-w-sm flex-col gap-6">
      <a href="#" class="flex items-center gap-2 self-center font-medium">
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Rocket class="size-4" />
        </div>
        CACI Inc.
      </a>
      <slot />
    </div>
  </div>
</template>
