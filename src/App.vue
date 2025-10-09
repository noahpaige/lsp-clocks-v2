<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Toaster } from "@/components/ui/sonner";
import { useToaster } from "@/composables/useToaster";
import { useWindowManager } from "@/composables/WindowManager/useWindowManager";
import TopNav from "@/components/Pages/HomePage/TopNav.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

// need this to enable dark mode
const mode = useColorMode();
const toaster = useToaster();
const windowMan = useWindowManager();

// Determine if TopNav should be shown (hide on login/register pages)
const route = useRoute();
const showTopNav = computed(() => {
  return route.meta.showTopNav;
});
</script>

<template>
  <div :class="showTopNav ? 'h-screen bg-background' : ''">
    <Toaster closeButton />
    <TopNav v-if="showTopNav" class="sticky top-0 z-50 flex-shrink-0" />
    <main class="absolute w-full h-full">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
