<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground from "@/components/AnimatedBackground.vue";
import AnimatedBackground2 from "@/components/AnimatedBackground2.vue";
import AnimatedBackground3 from "@/components/AnimatedBackground3.vue";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
import { data } from "../../../../lib/clockdata";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

const clockData = ref(data);

useIntervalFn(() => {
  clockData.value.utc += 1000;
  clockData.value.local += 1000;
  clockData.value.t += 1000;
  clockData.value.l += 1000;
  clockData.value.met += 1000;
}, 1000);
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground4 />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 1200 1200">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div class="flex flex-col w-full gap-8 justify-center items-center">
            <Clock labelRight="UTC" :time="clockData.utc" size="2xl" class="" />
            <Clock :labelRight="clockData.timezoneStr" :time="clockData.local" size="2xl" class="" />
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
