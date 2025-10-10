<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToaster } from "@/composables/useToaster";
import { useWindowManager } from "@/composables/WindowManager/useWindowManager";
import TopNav from "@/components/Pages/HomePage/TopNav.vue";
import { useRoute } from "vue-router";
import { computed, onMounted } from "vue";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { useSessionId } from "@/composables/useSessionId";

// need this to enable dark mode
const mode = useColorMode();
const toaster = useToaster();
const windowMan = useWindowManager();

// Determine if TopNav should be shown (hide on login/register pages)
const route = useRoute();
const showTopNav = computed(() => {
  return route.meta.showTopNav;
});

// Initialize session and load display configs at app start
const { loadDisplayConfigs } = useDisplayConfigs();
const { initializeSession } = useSessionId();
onMounted(() => {
  initializeSession();
  loadDisplayConfigs();
});
</script>

<template>
  <TooltipProvider>
    <div :class="showTopNav ? 'bg-background' : ''">
      <Toaster closeButton />
      <TopNav v-if="showTopNav" class="fixed top-0 left-0 right-0 z-50" />
      <main :class="showTopNav ? 'pt-14' : ''">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </TooltipProvider>
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
